import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { UserService } from '../../../service/user'

export class AuthMiddleware {
	private server: FastifyInstance

	protected service: UserService

	constructor(server: FastifyInstance, service: UserService) {
		this.server = server
		this.service = service
	}

	setup() {
		/* 
			For simplicity we are omitting real authentication
			In real world telegram sign authorization should be verified here
			We expect Authorization header in format: "Bearer <user-id>" 

			If user does not exist in database we will register him
			If user provides header: X-Balance-Restore we will restore his balance to initial value (10000)
		*/

		this.server.addHook(
			'preHandler',
			async (req: FastifyRequest, reply: FastifyReply) => {
				const auth = req.headers.authorization
				if (!auth) {
					return reply.code(401).send({ error: 'unauthorized' })
				}

				const restoreBalance = req.headers['x-balance-restore'] === 'true'

				const [type, value] = auth.split(' ')
				if (type !== 'Bearer' || !value) {
					return reply.code(401).send({ error: 'invalid authorization header' })
				}

				const userId = Number(value)
				if (!Number.isInteger(userId)) {
					return reply.code(401).send({ error: 'invalid user id' })
				}

				req.userId = userId

				await this.service.create({
					userId: userId,
					restoreBalance: restoreBalance,
				})
			},
		)
	}
}
