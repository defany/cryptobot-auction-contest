import type { BidRepo } from '.'
import { BidStatus } from '../../../generated/prisma/enums'

export async function refundBidsToUsersBalance(
	this: BidRepo,
	input: {
		auctionId: string
		excludeUserIds: number[]
	},
): Promise<void> {
	const grouped = await this.db.bid.aggregateRaw({
		pipeline: [
			{
				$match: {
					auctionId: { $oid: input.auctionId },
					status: BidStatus.PENDING,
					bidderId: { $nin: input.excludeUserIds },
				},
			},
			{
				$group: {
					_id: '$bidderId',
					total: { $sum: '$amount' },
				},
			},
		],
	})

	const rows = grouped as unknown as Array<{ _id: number; total: number }>

	for (const row of rows) {
		await this.db.user.updateMany({
			where: {
				userId: row._id,
			},
			data: {
				balance: {
					increment: row.total,
				},
			},
		})
	}
}
