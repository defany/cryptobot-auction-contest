import type { FastifyRequest } from 'fastify'
import type { AuctionHandler } from '.'
import type {
	CreateBidInBody,
	CreateBidInParams,
} from '../../../service/auction/create_bid'

type CreateBidOut = {
	bid_id: string 
}

export async function createBid(
	this: AuctionHandler,
	req: FastifyRequest<{ Body: CreateBidInBody; Params: CreateBidInParams }>,
): Promise<CreateBidOut> {
	const out = await this.service.createBid({
		amount: req.body.amount,
		auction_id: req.params.auction_id,
		bidder_id: req.userId,
	})

	return {
		bid_id: out.bidId,
	}
}
