import type { ExpiredAuctionRoundsWorker } from '.'
import type { Auction, Bid } from '../../../generated/prisma/client'
import type { QueryExecutor } from '../../../types/prisma'
import type { AddUserGiftsIn } from '../../repo/gift/add_user_gift'

export async function processExpiredRound(
	this: ExpiredAuctionRoundsWorker,
	auction: Auction,
): Promise<void> {
	await this.db.$transaction(async tx => {
		const winnerBids = await this.bidRepo
			.withTx(tx)
			.fetchTopBids(auction.id, auction.winnersPerRound)

		const winnersThisRound = winnerBids.length
		const supplyLeft = Math.max(0, auction.supply - winnersThisRound)

		// TODO: extend round if no winners were chosen 

		if (supplyLeft === 0) {
			await this.finishAuction(auction, winnerBids, tx)
		} else {
			await this.auctionRepo.withTx(tx).advanceRound({
				auctionId: auction.id,
				nextRound: auction.round + 1,
				nextExpiresAt: new Date(Date.now() + auction.roundDurationSec * 1000),
				supplyLeft: supplyLeft,
			})
		}

		// мы к старому номеру прибавляем кол-во текущих победителей
		const gift = await this.giftRepo
			.withTx(tx)
			.incrementLastIssuedNumber(auction.giftId, winnersThisRound)

		// после прибавления получаем начальный номер (пример: было 0, стало 100, стартовое число = (было)100 - (стало)100 + 1 = 1)
		const startNumber = gift.lastIssuedNumber - winnersThisRound + 1

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

		await this.bidRepo.withTx(tx).closeBids(bidIds)
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
}
