import type { BidRepo } from '.'

export async function fetchUserPlaceInTop(
	this: BidRepo,
	auctionId: string,
	bidderId: number,
): Promise<number | null> {
	const userBid = await this.db.bid.findFirst({
		where: {
			auctionId: auctionId,
			bidderId: bidderId,
		},
		orderBy: [
			{
				amount: 'desc',
			},
			{
				createdAt: 'asc',
			},
		],
	})

	if (!userBid) {
		return null
	}

	const ahead = await this.db.bid.count({
		where: {
			auctionId: auctionId,
			OR: [
				{
					amount: {
						gt: userBid.amount,
					},
				},
				{
					amount: userBid.amount,
					createdAt: {
						lt: userBid.createdAt,
					},
				},
			],
		},
	})

	return ahead + 1
}