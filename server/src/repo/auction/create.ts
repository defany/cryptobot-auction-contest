import type { AuctionRepo } from '.'

export type CreateIn = {
	giftId: string
	supply: number
	winnersPerRound: number
	roundExpiresAt: Date
	roundDurationSec: number 
	antiSniping?: {
		extensionDurationSec?: number
		thresholdSec?: number
		maxExtensions?: number
	}
}

export async function create(
	this: AuctionRepo,
	input: CreateIn,
): Promise<string> {
	const auction = await this.db.auction.create({
		data: {
			giftId: input.giftId,
			supply: input.supply,
			winnersPerRound: input.winnersPerRound,
			auctionAntiSniping: {
				create: input.antiSniping && {
					extensionDurationSec: input.antiSniping.extensionDurationSec,
					thresholdSec: input.antiSniping.thresholdSec,
					maxExtensions: input.antiSniping.maxExtensions,
				},
			},
			roundDurationSec: input.roundDurationSec,
			roundExpiresAt: input.roundExpiresAt,
			status: 'IN_PROGRESS',
		},
	})

	return auction.id
}
