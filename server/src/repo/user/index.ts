import type { QueryExecutor } from '../../../types/prisma'
import { create } from './create'
import { fetchById } from './fetch_by_id'
import { decreaseBalance, increaseBalance } from './manage_balance'
import { restoreBalance } from './restore_balance'

export class UserRepo {
	protected db: QueryExecutor

	protected balanceInitialAmount = 10_000

	create = create
	restoreBalance = restoreBalance
	fetchById = fetchById
	decreaseBalance = decreaseBalance
	increaseBalance = increaseBalance

	constructor(db: QueryExecutor) {
		this.db = db
	}

	withTx(tx: QueryExecutor): UserRepo {
		return new UserRepo(tx)
	}
}
