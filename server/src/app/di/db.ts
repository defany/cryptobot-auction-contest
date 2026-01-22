import { DI } from '.'
import { PrismaClient } from '../../../generated/prisma/client'
import { runTx } from '../../../utils/mongo/tx'

export async function database(this: DI): Promise<PrismaClient> {
	const db = new PrismaClient()

	this.onShutdown(async () => {
		return await db.$disconnect()
	})

	return db
}