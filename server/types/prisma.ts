import { PrismaClient } from '../generated/prisma/client'

export type QueryExecutor =
	| PrismaClient
	| Omit<
		PrismaClient,
		'$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
	>
