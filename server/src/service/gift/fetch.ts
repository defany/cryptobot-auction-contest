import type { GiftService } from '.'
import type { Gift } from '../../../generated/prisma/client'
import type { FetchAllOut } from '../../repo/gift/fetch'

export type FetchOut = {
	gifts: FetchAllOut[]
}

export async function fetch(this: GiftService): Promise<FetchOut> {
	const gifts = await this.giftRepo.fetchAll()

	return {
		gifts: gifts, 
	}
}