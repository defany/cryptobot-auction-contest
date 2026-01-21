import type { FastifyReply, FastifyRequest } from 'fastify'
import type { GiftHandler } from '.'
import type { FetchAllOut } from '../../../repo/gift/fetch'

type FetchGiftsOut = {
	gifts: FetchAllOut[]
}

export async function fetchGifts(
	this: GiftHandler,
	req: FastifyRequest,
	res: FastifyReply,
): Promise<FetchGiftsOut> {
	const out = await this.service.fetch()

	return {
		gifts: out.gifts,
	}
}
