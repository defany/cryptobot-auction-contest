import type { UserService } from '.'

export type CreateIn = {
	userId: number
	restoreBalance: boolean
}

export async function create(this: UserService, input: CreateIn): Promise<void> {
	await this.repo.create(input.userId)

	if (!input.restoreBalance) {
		return 
	}

	await this.repo.restoreBalance(input.userId)
}