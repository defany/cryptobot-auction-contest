import Fastify, { type FastifyInstance } from 'fastify'
import {
	type ZodTypeProvider,
	serializerCompiler,
	validatorCompiler,
} from 'fastify-type-provider-zod'
import { DI } from '.'

declare module 'fastify' {
	interface FastifyRequest {
		userId: number
	}
}

export function httpServer(this: DI): FastifyInstance {
	const server = Fastify({
		logger: true,
	})
		.setValidatorCompiler(validatorCompiler)
		.setSerializerCompiler(serializerCompiler)
		.withTypeProvider<ZodTypeProvider>()

	this.onShutdown(async () => {
		return await server.close()
	})

	return server
}
