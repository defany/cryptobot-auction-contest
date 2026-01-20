import type { BidRepo } from '.'
import type { Bid } from '../../../generated/prisma/client'

export async function fetchTopBids(
	this: BidRepo,
	auctionId: string,
	limit: number,
): Promise<Bid[]> {
	const bids = await this.db.bid.findMany({
		where: {
			auctionId: auctionId,
			status: 'PENDING',
		},
		orderBy: [
			{
				amount: 'desc',
			},
			{
				createdAt: 'asc',
			},
		],
		take: limit,
	})

	return bids
}
