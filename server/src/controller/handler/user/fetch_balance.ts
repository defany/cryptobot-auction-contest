import type { FastifyRequest } from 'fastify'
import type { UserHandler } from '.'

type FetchBalanceOut = {
	amount: number
}

export async function fetchBalance(
	this: UserHandler,
	req: FastifyRequest,
): Promise<FetchBalanceOut> {
	const balance = await this.service.fetchBalance(req.userId)

	return {
		amount: balance,
	}
}
