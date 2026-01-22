import type { BidRepo } from '.'

export async function refundBidsToUsersBalance(
	this: BidRepo,
	input: {
		auctionId: string
		excludeUserIds: number[]
	},
): Promise<void> {
	const bids = await this.db.bid.findMany({
		where: {
			bidderId: {
				notIn: input.excludeUserIds
			},
			status: 'PENDING'
		}
	})

	await Promise.all(
		bids.map((bid) => {
			return this.db.user.updateMany({
				where: {
					userId: bid.bidderId,
				},
				data: {
					balance: {
						increment: bid.amount,
					},
				},
			})
		}),
	)
}
