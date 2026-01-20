import type { GiftService } from '.'
import type { Gift } from '../../../generated/prisma/client'

export type FetchOut = {
	gifts: Gift[]
}

export async function fetch(this: GiftService): Promise<FetchOut> {
	const gifts = await this.giftRepo.fetchAll()

	return {
		gifts: gifts, 
	}
}