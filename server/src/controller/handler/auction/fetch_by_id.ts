import type { FastifyRequest } from 'fastify'
import type { AuctionHandler } from '.'
import type { Auction, Bid } from '../../../../generated/prisma/client'
import type {
	FetchAuctionByIdInParams
} from '../../../service/auction/fetch_by_id'

type FetchByIdOut = {
	auction: Auction | null
	minimal_bid_to_beat: Bid | null
}

export async function fetchById(
	this: AuctionHandler,
	req: FastifyRequest<{
		Params: FetchAuctionByIdInParams
	}>,
): Promise<FetchByIdOut> {
	const out = await this.service.fetchById({
		auction_id: req.params.auction_id,
		user_id: req.userId,
	})

	return {
		auction: out.auction,
		minimal_bid_to_beat: out.minimalBidToBeat,
	}
}
