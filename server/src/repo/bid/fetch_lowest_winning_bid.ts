import type { BidRepo } from '.'
import type { Bid } from '../../../generated/prisma/client'

/*
	возвращает минимальную ставку, которая стоит перед ставкой пользователя
	и входит в состав победителей текущего раунда аукциона.

	сортировка ставок (для детерминации победителей, такая же как и в топе):
		- amount desc 
		- createdAt asc (при равных суммах выигрывает более ранняя ставка)

	оптимизации:
	Вместо подсчёта общего количества ставок и offset-запросов, выгружаем только топ ставок
	победителей обычно немного, поэтому загрузка в память и работа с массивом дешевле, чем каунт + скип при большом числе ставок
*/
export async function fetchLowestWinningBid(
	this: BidRepo,
	auctionId: string,
	winnersPerRound: number,
	bidderId: number,
): Promise<Bid | null> {
	const isWinnersPerRoundPositive = Math.max(0, winnersPerRound)
	if (isWinnersPerRoundPositive === 0) {
		return null
	}

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
		take: winnersPerRound,
	})

	if (bids.length === 0) {
		return null
	}

	const userIndex = bids.findIndex(b => b.bidderId === bidderId)

	if (userIndex === -1) {
		return bids[bids.length - 1] ?? null
	}

	if (userIndex === 0) {
		return null
	}

	return bids[userIndex - 1] ?? null
}