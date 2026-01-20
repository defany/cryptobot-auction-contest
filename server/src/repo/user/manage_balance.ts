import type { UserRepo } from '.'


export async function decreaseBalance(this: UserRepo, userId: number, amount: number): Promise<void> {
	await this.db.user.updateMany({
		where: {
			userId: userId,
			balance: {
				gte: amount,
			},
		},
		data: {
			balance: {
				decrement: amount,
			},
		},
	})
}

export async function increaseBalance(this: UserRepo, userId: number, amount: number): Promise<void> {
	await this.db.user.updateMany({
		where: {
			userId: userId,
		},
		data: {
			balance: {
				increment: amount,
			},
		},
	})
}	