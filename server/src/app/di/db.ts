import { DI } from '.'
import { PrismaClient } from '../../../generated/prisma/client'

export async function database(this: DI): Promise<PrismaClient> {
	const db = new PrismaClient()

	this.onShutdown(async () => {
		return await db.$disconnect()
	})

	return db
}
