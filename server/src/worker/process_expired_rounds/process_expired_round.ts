import type { ExpiredAuctionRoundsWorker } from '.'
import type { Auction, Bid } from '../../../generated/prisma/client'
import type { QueryExecutor } from '../../../types/prisma'
import { runTx } from '../../../utils/mongo/tx'
import type { AddUserGiftsIn } from '../../repo/gift/add_user_gift'

export async function processExpiredRound(
	this: ExpiredAuctionRoundsWorker,
	auction: Auction,
): Promise<void> {
	await runTx(this.db, async tx => {
		const winnerBids = await this.bidRepo
			.withTx(tx)
			.fetchTopBids(auction.id, auction.winnersPerRound)

		const winnersCountThisRound = winnerBids.length
		const supplyLeft = Math.max(0, auction.supply - winnersCountThisRound)

		if (supplyLeft === 0) {
			await this.finishAuction(auction, winnerBids, tx)
		} else {
			let pendingBidsCount = await this.bidRepo.fetchCountByStatus(
				auction.id,
				'PENDING',
			)

			// не учитываем тех, кто победил
			pendingBidsCount = pendingBidsCount - winnersCountThisRound

			await this.auctionRepo.withTx(tx).advanceRound({
				auctionId: auction.id,
				nextRound: auction.round + 1,
				nextExpiresAt:
					pendingBidsCount > 0
						? new Date(Date.now() + auction.roundDurationSec * 1000)
						: null,
				supplyLeft: supplyLeft,
			})
		}

		// мы к старому номеру прибавляем кол-во текущих победителей
		const gift = await this.giftRepo
			.withTx(tx)
			.incrementLastIssuedNumber(auction.giftId, winnersCountThisRound)

		// после прибавления получаем начальный номер (пример: было 0, стало 100, стартовое число = (было)100 - (стало)100 + 1 = 1)
		const startNumber = gift.lastIssuedNumber - winnersCountThisRound + 1

		const bidIds: string[] = []

		const userGifts: AddUserGiftsIn[] = []

		for (const [index, bid] of winnerBids.entries()) {
			bidIds.push(bid.id)

			userGifts.push({
				userId: bid.bidderId,
				giftId: auction.giftId,
				giftNumber: startNumber + index,
			})
		}

		await this.giftRepo.withTx(tx).addUserGifts(userGifts)
		await this.bidRepo.withTx(tx).closeBids(auction.id, bidIds)
	})
}

export async function finishAuction(
	this: ExpiredAuctionRoundsWorker,
	auction: Auction,
	winnerBids: Bid[],
	tx: QueryExecutor,
): Promise<void> {
	const bidderIds = winnerBids.map(bid => bid.bidderId)

	await this.bidRepo.withTx(tx).refundBidsToUsersBalance({
		auctionId: auction.id,
		excludeUserIds: bidderIds,
	})

	await this.auctionRepo.withTx(tx).finishAuction(auction.id)

	await this.bidRepo.withTx(tx).closeBids(auction.id)
}
