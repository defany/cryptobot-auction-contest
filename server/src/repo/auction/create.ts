import type { AuctionRepo } from '.'

export type CreateIn = {
	giftId: string
	supply: number
	winnersPerRound: number
	roundDurationSec: number
	antiSniping_settings?: {
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
				create: input.antiSniping_settings && {
					enabled: true,
					extensionDurationSec: input.antiSniping_settings.extensionDurationSec,
					thresholdSec: input.antiSniping_settings.thresholdSec,
					maxExtensions: input.antiSniping_settings.maxExtensions,
				},
			},
			roundDurationSec: input.roundDurationSec,
			status: 'SCHEDULED',
		},
	})

	return auction.id
}
