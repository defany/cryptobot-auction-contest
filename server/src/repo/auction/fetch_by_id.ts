import type { AuctionRepo } from '.'
import type { Auction } from '../../../generated/prisma/client'


export async function fetchById(this: AuctionRepo, auctionId: string): Promise<Auction | null> {
	const auction = await this.db.auction.findUnique({
		where: {
			id: auctionId,
		},
	})

	return auction
}