import type { BidRepo } from '.'

export type CreateBidIn = {
	bidderId: number
	auctionId: string
	amount: number
}

export async function createBid(
	this: BidRepo,
	input: CreateBidIn,
): Promise<string> {
	/* 
		Не смог подружить findAndModify + prisma, поэтому пришлось в два запроса для upsert'а

		Встроенный в призму механизм не подходит из-за того, что наш индекс не уникален (сколько угодно CLOSED ставок на аук, но только одна PENDING)
	*/
	const existing = await this.db.bid.findFirst({
		where: {
			auctionId: input.auctionId,
			bidderId: input.bidderId,
			status: 'PENDING',
		},
		select: {
			id: true,
		},
	})
	if (existing) {
		const bid = await this.db.bid.update({
			where: {
				id: existing.id,
			},
			data: {
				amount: {
					increment: input.amount,
				},
			},
			select: {
				id: true,
			},
		})

		return bid.id
	}

	const bid = await this.db.bid.create({
		data: {
			auctionId: input.auctionId,
			bidderId: input.bidderId,
			amount: input.amount,
			status: 'PENDING',
		},
		select: {
			id: true,
		},
	})

	return bid.id
}
