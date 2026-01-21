import type { GiftRepo } from '.'

export type FetchUserGiftOut = {
	gift: {
		id: string
		name: string
		lastIssuedNumber: number
	}
	id: string 
	number: number 
}

export async function fetchUserGifts(
	this: GiftRepo,
	userId: number,
): Promise<FetchUserGiftOut[]> {
	const gifts = await this.db.userGift.findMany({
		where: {
			userId: userId,
		},
		select: {
			gift: true,
			id: true, 
			number: true, 
		},
	})

	return gifts
}
