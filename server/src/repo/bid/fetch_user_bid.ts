import type { BidRepo } from '.'
import type { Bid } from '../../../generated/prisma/client'

export async function fetchUserBid(
	this: BidRepo,
	auctionId: string,
	userId: number,
): Promise<Bid | null> {
	const bid = await this.db.bid.findFirst({
		where: {
			auctionId: auctionId,
			bidderId: userId,
			status: 'PENDING',
		},
	})

	return bid
}
