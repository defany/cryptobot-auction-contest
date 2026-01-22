import type { UserService } from '.'

export type CreateIn = {
	userId: number
	restoreBalanceAmount: number | null
}

export async function create(this: UserService, input: CreateIn): Promise<void> {
	await this.repo.create(input.userId)

	if (!input.restoreBalanceAmount) {
		return 
	}

	await this.repo.increaseBalance(input.userId, input.restoreBalanceAmount)
}