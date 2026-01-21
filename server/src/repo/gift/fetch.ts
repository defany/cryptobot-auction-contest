import type { GiftRepo } from '.'
import type { Gift } from '../../../generated/prisma/client'

export type FetchAllOut = {
	name: string
	id: string
	auctions: {
		id: string
	}[]
}

export async function fetchAll(this: GiftRepo): Promise<FetchAllOut[]> {
	const gifts = await this.db.gift.findMany({
		select: {
			id: true,
			name: true,
			auctions: {
				where: {
					status: {
						'not': 'FINISHED'
					},
				},
				select: { id: true },
				take: 1,
			},
		},
	})

	return gifts
}
