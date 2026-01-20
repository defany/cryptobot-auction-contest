import type { FastifyRequest } from 'fastify'
import type { AuctionHandler } from '.'
import type { Bid } from '../../../../generated/prisma/client'
import type { FetchTopBidsIn, FetchTopBidsInParams } from '../../../service/auction/fetch_top_bids'

type FetchTopBidsOut = {
	bids: Bid[]
	user_bid: Bid | null
	user_place: number | null
}

export async function fetchTopBids(
	this: AuctionHandler,
	req: FastifyRequest<{ Params: FetchTopBidsInParams }>,
): Promise<FetchTopBidsOut> {
	const out = await this.service.fetchTopBids({
		auction_id: req.params.auction_id,
		user_id: req.userId,
	})

	return {
		bids: out.bids,
		user_bid: out.userBid,
		user_place: out.userPlace,
	}
}
