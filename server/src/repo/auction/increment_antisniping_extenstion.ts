import type { AuctionRepo } from '.'

export async function incrementAntisnipingExtensionIfNeeded(
	this: AuctionRepo,
	input: {
		auctionId: string
		maxExtensions: number
	},
): Promise<void> {
	const res = await this.db.auctionAntiSniping.updateMany({
		where: {
			auctionId: input.auctionId,
			enabled: true,
			currentExtension: {
				lt: input.maxExtensions,
			},
		},
		data: {
			currentExtension: {
				increment: 1,
			},
		},
	})

	if (res.count !== 1) {
		throw new Error('no more extensions this round')
	}
}
