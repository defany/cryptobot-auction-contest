import { z } from 'zod'
import type { AuctionService } from '.'

export const CreateAuctionInSchema = z.object({
	gift_id: z.string(),
	supply: z.number().int().positive(),
	winners_per_round: z.number().int().positive(),
	round_duration_sec: z.number().int().positive(),
	round_expires_at: z.coerce.date().refine(
		v => v.getTime() > Date.now(),
		{ message: 'round_expires_at must be in the future' },
	),
	anti_sniping: z
		.object({
			extensionDurationSec: z.number().int().positive().optional(),
			thresholdSec: z.number().int().positive().optional(),
			maxExtensions: z.number().int().nonnegative().optional(),
		})
		.optional(),
})

export type CreateAuctionIn = z.infer<typeof CreateAuctionInSchema>

export type CreateAuctionOut = {
	auctionId: string
}

export async function create(
	this: AuctionService,
	input: CreateAuctionIn,
): Promise<CreateAuctionOut> {
	const auctionId = await this.auctionProvider.create({
		giftId: input.gift_id,
		supply: input.supply,
		winnersPerRound: input.winners_per_round,
		roundExpiresAt: input.round_expires_at,
		antiSniping: input.anti_sniping,
		roundDurationSec: input.round_duration_sec,
	})

	return {
		auctionId: auctionId,
	}
}
