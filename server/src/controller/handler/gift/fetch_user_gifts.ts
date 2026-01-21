import type { FastifyRequest } from 'fastify'
import type { GiftHandler } from '.'
import type { FetchUserGiftOut } from '../../../repo/gift/fetch_user_gifts'

export type FetchUserGiftsOut = {
	gifts: FetchUserGiftOut[]
}

export async function fetchUserGifts(
	this: GiftHandler,
	req: FastifyRequest,
): Promise<FetchUserGiftsOut> {
	const out = await this.service.fetchUserGifts({
		user_id: req.userId,
	})

	return {
		gifts: out.gifts,
	}
}
