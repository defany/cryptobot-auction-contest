import { fastify, type FastifyError, type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify'
import { config } from '../../../config'
import { BaseError } from '../../../errors'
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'

export class ErrorMiddleware {
	private server: FastifyInstance

	constructor(server: FastifyInstance) {
		this.server = server
	}

	setup() {
		this.server.setErrorHandler(
			(err: FastifyError | BaseError, req: FastifyRequest, res: FastifyReply) => {
				const isProd = config.node_env === 'production'

				if (hasZodFastifySchemaValidationErrors(err)) {
					res.status(422).send({
						message: err.message
					})

					return 
				}

				if (!err.statusCode) {
					const out: Record<string, unknown> = {
						message: 'Internal error',
					}

					if (!isProd) {
						out.details = err
					}

					res.status(500).send(out)

					return
				}

				res.status(err.statusCode).send({
					message: err.message
				})
			},
		)
	}
}