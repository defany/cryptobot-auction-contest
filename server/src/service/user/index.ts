import type { UserRepo } from '../../repo/user'
import { create } from './create'
import { fetchBalance } from './fetch_balance'


export class UserService {
	protected repo: UserRepo

	create = create
	fetchBalance = fetchBalance

	constructor(repo: UserRepo) {
		this.repo = repo 
	}
}