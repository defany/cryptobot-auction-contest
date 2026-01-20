import type { FastifyReply, FastifyRequest } from 'fastify'
import type { AuctionHandler } from '.'
import type { CreateAuctionIn } from '../../../service/auction/create'

type CreateOut = {
	auction_id: string
}

export async function create(
	this: AuctionHandler,
	req: FastifyRequest<{ Body: CreateAuctionIn }>,
): Promise<CreateOut> {
	const out = await this.service.create(req.body)

	return {
		auction_id: out.auctionId,
	}
}
