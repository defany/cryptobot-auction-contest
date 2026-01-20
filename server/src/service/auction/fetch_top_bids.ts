import z from 'zod'
import type { AuctionService } from '.'
import type { Bid } from '../../../generated/prisma/client'

export const FetchTopBidsInSchema = z.object({
	auction_id: z.string().min(1),
	user_id: z.number(),
})

export const FetchTopBidsParamsSchema = FetchTopBidsInSchema.pick({
	auction_id: true,
})

export type FetchTopBidsInParams = z.infer<typeof FetchTopBidsParamsSchema>
export type FetchTopBidsIn = z.infer<typeof FetchTopBidsInSchema>

export type FetchTopBidsOut = {
	bids: Bid[]
	userBid: Bid | null
	userPlace: number | null
}

export async function fetchTopBids(
	this: AuctionService,
	input: FetchTopBidsIn,
): Promise<FetchTopBidsOut> {
	const auction = await this.auctionProvider.fetchById(input.auction_id)
	if (!auction) {
		return {
			bids: [],
			userBid: null,
			userPlace: null,
		}
	}

	const bids = await this.bidProvider.fetchTopBids(
		input.auction_id,
		auction.winnersPerRound,
	)

	const userBid = await this.bidProvider.fetchUserBid(
		input.auction_id,
		input.user_id,
	)

	const userPlaceInTop = await this.bidProvider.fetchUserPlaceInTop(
		input.auction_id,
		input.user_id,
	)

	return {
		bids: bids,
		userBid: userBid,
		userPlace: userPlaceInTop,
	}
}
