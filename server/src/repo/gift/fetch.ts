import type { GiftRepo } from '.'
import type { Gift } from '../../../generated/prisma/client'

export async function fetchAll(this: GiftRepo): Promise<Gift[]> {
	const gifts = await this.db.gift.findMany({
		select: {
			id: true,
			name: true,
			auctions: {
				where: {
					status: 'IN_PROGRESS',
				},
				select: { id: true },
				take: 1,
			},
		},
	})

	return gifts
}
