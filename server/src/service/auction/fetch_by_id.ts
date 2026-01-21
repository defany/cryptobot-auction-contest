import { z } from 'zod'
import type { AuctionService } from '.'
import type { Auction, Bid } from '../../../generated/prisma/client'

export const FetchAuctionByIdInSchema = z.object({
	auction_id: z.string(),
	user_id: z.number(),
})

export const FetchAuctionByIdInParamsSchema = FetchAuctionByIdInSchema.pick({
	auction_id: true,
})

export type FetchAuctionByIdInParams = z.infer<
	typeof FetchAuctionByIdInParamsSchema
>
export type FetchAuctionByIdIn = z.infer<typeof FetchAuctionByIdInSchema>

export type FetchAuctionByIdOut = {
	auction: Auction | null
	minimalBidToBeat: Bid | null
}

export async function fetchById(
	this: AuctionService,
	input: FetchAuctionByIdIn,
): Promise<FetchAuctionByIdOut> {
	await FetchAuctionByIdInSchema.parseAsync(input)

	const auction = await this.auctionProvider.fetchById(input.auction_id)
	if (!auction) {
		return {
			auction: null,
			minimalBidToBeat: null,
		}
	}

	const minimalBid = await this.bidProvider.fetchLowestWinningBid(
		input.auction_id,
		auction.winnersPerRound,
		input.user_id,
	)

	return {
		auction: auction,
		minimalBidToBeat: minimalBid,
	}
}
