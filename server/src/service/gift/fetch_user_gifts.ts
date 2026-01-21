import z from 'zod'
import type { GiftService } from '.'
import type { FetchUserGiftOut } from '../../repo/gift/fetch_user_gifts'

export const FetchUserGiftsSchema = z.object({
	user_id: z.number().int().positive(),
})

export type FetchUserGiftsIn = z.infer<typeof FetchUserGiftsSchema>

export type FetchUserGiftsOut = {
	gifts: FetchUserGiftOut[]
}

export async function fetchUserGifts(
	this: GiftService,
	input: FetchUserGiftsIn,
): Promise<FetchUserGiftsOut> {
	await FetchUserGiftsSchema.parseAsync(input)

	const gifts = await this.giftRepo.fetchUserGifts(input.user_id)

	return {
		gifts: gifts,
	}
}
