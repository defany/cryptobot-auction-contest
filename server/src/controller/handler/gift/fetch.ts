import type { FastifyReply, FastifyRequest } from 'fastify'
import type { GiftHandler } from '.'
import type { Gift } from '../../../../generated/prisma/client'

type FetchGiftsOut = {
	gifts: Gift[]
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
