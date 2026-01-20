import type { GiftRepo } from '.'
import type { UserGiftCreateManyInput } from '../../../generated/prisma/models'

export type AddUserGiftsIn = {
	userId: number
	giftId: string
	giftNumber: number 
}

export async function addUserGifts(
	this: GiftRepo,
	input: AddUserGiftsIn[],
): Promise<void> {
	const insertData: UserGiftCreateManyInput[] = input.map(input => {
		return {
			giftId: input.giftId,
			userId: input.userId,
			number: input.giftNumber, 
		}
	})

	await this.db.userGift.createMany({
		data: insertData,
	})
}
