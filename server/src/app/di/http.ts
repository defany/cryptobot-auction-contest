import Fastify, { type FastifyInstance } from 'fastify'
import {
	type ZodTypeProvider,
	serializerCompiler,
	validatorCompiler,
} from 'fastify-type-provider-zod'
import { DI } from '.'
import { ErrorMiddleware } from '../../controller/middleware/error'

declare module 'fastify' {
	interface FastifyRequest {
		userId: number
	}
}

export async function httpServer(this: DI): Promise<FastifyInstance> {
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

export async function errorMiddleware(this: DI): Promise<ErrorMiddleware> {
	return new ErrorMiddleware(await this.httpServer)
}