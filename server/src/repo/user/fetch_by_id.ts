import type { UserRepo } from '.'
import type { User } from '../../../generated/prisma/client'


export async function fetchById(this: UserRepo, userId: number): Promise<User | null> {
	const user = await this.db.user.findUnique({
		where: {
			userId: userId,
		},
	})

	return user
}