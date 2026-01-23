import { z } from 'zod'
import type { AuctionService } from '.'
import { ErrAuctionNotFound, ErrInactiveAuction, ErrInsufficientFunds, ErrTooSmallBid, ErrUserNotFound } from '../../errors'
import { runTx } from '../../../utils/mongo/tx'

export const CreateBidInSchema = z.object({
	auction_id: z.string().min(1),
	bidder_id: z.number(),
	amount: z.string().refine(
		v => {
			const n = Number(v)
			return Number.isFinite(n) && n >= 1
		},
		{ message: 'amount must be >= 1' },
	),
})

export const CreateBidParamsSchema = CreateBidInSchema.pick({
	auction_id: true,
})

export const CreateBidBodySchema = CreateBidInSchema.pick({
	amount: true,
})

export type CreateBidInParams = z.infer<typeof CreateBidParamsSchema>
export type CreateBidInBody = z.infer<typeof CreateBidBodySchema>

export type CreateBidIn = z.infer<typeof CreateBidInSchema>

export type CreateBidOut = {
	bidId: string
}

export async function createBid(
	this: AuctionService,
	input: CreateBidIn,
): Promise<CreateBidOut> {
	await CreateBidInSchema.parseAsync(input)

	const out = await runTx(this.db, async tx => {
		const auction = await this.auctionProvider
			.withTx(tx)
			.fetchById(input.auction_id)
		if (!auction) {
			throw new ErrAuctionNotFound()
		}

		if (auction.status === 'FINISHED') {
			throw new ErrInactiveAuction()
		}

		const userBid = await this.bidProvider
			.withTx(tx)
			.fetchUserBid(input.auction_id, input.bidder_id)

		const lowestBid = await this.bidProvider
			.withTx(tx)
			.fetchLowestWinningBid(
				input.auction_id,
				auction.winnersPerRound,
				input.bidder_id,
			)

		const resultingBidAmount =
			Number(userBid?.amount ?? 0) + Number(input.amount)

		if (lowestBid && resultingBidAmount < Number(lowestBid.amount)) {
			throw new ErrTooSmallBid()
		}

		const user = await this.userProvider.withTx(tx).fetchById(input.bidder_id)
		if (!user) {
			throw new ErrUserNotFound()
		}

		if (user.balance < Number(input.amount)) {
			throw new ErrInsufficientFunds()
		}

		const bidId = await this.bidProvider.withTx(tx).createBid({
			auctionId: input.auction_id,
			bidderId: input.bidder_id,
			amount: Number(input.amount),
		})

		if (auction.status === 'SCHEDULED') {
			const now = new Date()

			const nextRoundExpiresAt = new Date(
				now.getTime() + auction.roundDurationSec * 1000,
			)

			await this.auctionProvider
				.withTx(tx)
				.startAuction(auction.id, nextRoundExpiresAt)
		}

		await this.userProvider
			.withTx(tx)
			.decreaseBalance(input.bidder_id, Number(input.amount))

		const antiSnipingSettings = await this.auctionProvider
			.withTx(tx)
			.fetchAntisnipingSettings(input.auction_id)

		if (!antiSnipingSettings || !antiSnipingSettings.enabled) {
			return {
				bidId: bidId,
			}
		}

		if (antiSnipingSettings.currentExtension >= antiSnipingSettings.maxExtensions) {
			return {
				bidId: bidId
			}
		}

		const wasExtended = await this.auctionProvider
			.withTx(tx)
			.extendRoundIfNeeded({
				auctionId: input.auction_id,
				currentExpiresAt: auction.roundExpiresAt,
				thresholdSec: antiSnipingSettings.thresholdSec,
				extensionDurationSec: antiSnipingSettings.extensionDurationSec,
			})

		if (wasExtended) {
			await this.auctionProvider
				.withTx(tx)
				.incrementAntisnipingExtensionIfNeeded({
					auctionId: input.auction_id,
					maxExtensions: antiSnipingSettings.maxExtensions,
				})
		}

		return {
			bidId: bidId,
		}
	})

	return out
}
