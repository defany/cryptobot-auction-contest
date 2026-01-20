import type { AuctionRepo } from '.'
import type { Auction } from '../../../generated/prisma/client'

export async function fetchExpiredAuctions(
	this: AuctionRepo,
): Promise<Auction[]> {
	const auctions = await this.db.auction.findMany({
		where: {
			roundExpiresAt: {
				lte: new Date(),
			},
		},
	})

	return auctions
}
