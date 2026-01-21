import type { BidRepo } from '.'
import type { Bid } from '../../../generated/prisma/client'
import type { BidStatus } from '../../../generated/prisma/enums'

export async function fetchCountByStatus(
	this: BidRepo,
	auctionId: string,
	status: BidStatus,
): Promise<number> {
	const bidsCount = await this.db.bid.count({
		where: {
			auctionId: auctionId,
			status: status,
		},
	})

	return bidsCount
}
