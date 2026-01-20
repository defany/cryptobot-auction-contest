import type { UserRepo } from '../../repo/user'
import { create } from './create'


export class UserService {
	protected repo: UserRepo

	create = create

	constructor(repo: UserRepo) {
		this.repo = repo 
	}
}