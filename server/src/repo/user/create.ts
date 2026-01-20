import type { UserRepo } from '.'

export async function create(this: UserRepo, userId: number): Promise<void> {
	await this.db.user.upsert({
		where: {
			userId: userId,
		},
		create: {
			userId: userId,
			balance: this.balanceInitialAmount,
		},
		update: {},
	})
}
