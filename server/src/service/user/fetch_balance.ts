import type { UserService } from '.'


export async function fetchBalance(this: UserService, userId: number): Promise<number> {
	const user = await this.repo.fetchById(userId)
	if (!user) {
		return 0 
	}

	return user.balance 
}