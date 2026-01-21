import 'dotenv/config'
import { z } from 'zod'

const lowercasedEnv = Object.fromEntries(
	Object.entries(process.env).map(([k, v]) => [k.toLowerCase(), v]),
)

const EnvSchema = z.object({
	http_host: z.string().default('localhost'),
	http_port: z.coerce.number().int().min(1).default(3000),
	node_env: z
		.enum(['development', 'test', 'production'])
		.default('development'),

	database_url: z.string().min(1),

	mongo_user: z.string().min(1).optional(),
	mongo_password: z.string().min(1).optional(),
	mongo_host: z.string().min(1).optional(),
	mongo_port: z.coerce.number().int().min(1).max(65535).optional(),
	mongo_db: z.string().min(1).optional(),
})

const parsed = EnvSchema.safeParse(lowercasedEnv)
if (!parsed.success) {
	const errors = parsed.error.flatten().fieldErrors
	throw new Error(
		`Invalid env:\n${Object.entries(errors)
			.map(([k, v]) => `${k}: ${v?.join(', ')}`)
			.join('\n')}`,
	)
}

export const config = parsed.data
export type Config = typeof config
