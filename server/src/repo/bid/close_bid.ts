import type { BidRepo } from '.'

export async function closeBids(
	this: BidRepo,
	auctionId: string,
	bidIds?: string[],
): Promise<void> {
	await this.db.bid.updateMany({
		where: {
			auctionId: auctionId,
			id: {
				in: bidIds,
			},
		},
		data: {
			status: 'CLOSED',
		},
	})
}
