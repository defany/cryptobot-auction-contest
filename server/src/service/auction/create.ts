import { sleep } from 'bun'
import { z } from 'zod'
import type { AuctionService } from '.'
import { runTx } from '../../../utils/mongo/tx'
import { ErrAnotherActiveAuction } from '../../errors'

export const CreateAuctionInSchema = z.object({
	gift_id: z.string(),
	supply: z.number().int().positive(),
	winners_per_round: z.number().int().positive(),
	round_duration_sec: z.number().int().positive(),
	antisniping_settings: z
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
	await CreateAuctionInSchema.parseAsync(input)

	const auctionId = await runTx(this.db, async (tx) => {
		const hasAuctionInProgress =
			await this.auctionProvider.withTx(tx).hasAuctionInProgress(input.gift_id)

		if (hasAuctionInProgress) {
			throw new ErrAnotherActiveAuction()
		}

		const auctionId = await this.auctionProvider.withTx(tx).create({
			giftId: input.gift_id,
			supply: input.supply,
			winnersPerRound: input.winners_per_round,
			antiSniping_settings: input.antisniping_settings,
			roundDurationSec: input.round_duration_sec,
		})

		return auctionId
	})

	return {
		auctionId: auctionId,
	}
}
