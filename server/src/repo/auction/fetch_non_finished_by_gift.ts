import type { AuctionRepo } from '.'
import type { Auction } from '../../../generated/prisma/client'

export async function hasAuctionInProgress(
	this: AuctionRepo,
	giftId: string,
): Promise<boolean> {
	const auction = await this.db.auction.findFirst({
		where: {
			giftId: giftId,
			status: {
				not: 'FINISHED',
			},
		},
	})

	return auction !== null
}
