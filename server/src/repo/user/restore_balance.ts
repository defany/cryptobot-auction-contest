import type { UserRepo } from '.'


export async function restoreBalance(this: UserRepo, userId: number): Promise<void> {
	await this.db.user.update({
		where: {
			userId: userId,
		},
		data: {
			balance: this.balanceInitialAmount,
		},
	})
}