import type { BidRepo } from '.'

export async function closeBids(
	this: BidRepo,
	bidIds: string[],
): Promise<void> {
	await this.db.bid.updateMany({
		where: {
			id: {
				in: bidIds,
			},
		},
		data: {
			status: 'CLOSED',
		},
	})
}
