import type { GiftRepo } from '.'
import type { Gift } from '../../../generated/prisma/client'

export async function incrementLastIssuedNumber(
	this: GiftRepo,
	giftId: string,
	newLastIssuedNumber: number,
): Promise<Gift> {
	const gift = await this.db.gift.update({
		where: {
			id: giftId,
		},
		data: {
			lastIssuedNumber: {
				increment: newLastIssuedNumber,
			},
		},
		select: {
			id: true,
			lastIssuedNumber: true,
			name: true,
		},
	})

	return gift
}
