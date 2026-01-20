import type { BidRepo } from '.'
import type { BidStatus } from '../../../generated/prisma/enums'

export type CreateBidIn = {
	bidderId: number
	auctionId: string
	amount: number
	status?: BidStatus
	createdAt?: Date
}

export async function createBid(
	this: BidRepo,
	input: CreateBidIn,
): Promise<string> {
	const bid = await this.db.bid.upsert({
		create: {
			bidderId: input.bidderId,
			auctionId: input.auctionId,
			amount: input.amount,
			status: input.status,
			createdAt: input.createdAt,
		},
		update: {
			amount: {
				increment: input.amount
			},
		},
		where: {
			auctionId_bidderId_status: {
				bidderId: input.bidderId,
				auctionId: input.auctionId,
				status: 'PENDING',
			},
		},
	})

	return bid.id
}
