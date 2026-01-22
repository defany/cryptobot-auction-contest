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
			Для простоты мы упускаем реальную аутентификацию 
			В реальном же мире мы бы проверяли какую-нибудь подпись от тг

			Мы ожидаем заголовок авторизации в формате: Bearer <айди пользователя>

			Если юзера нет в базе данных, мы его зарегистрируем
			Если юзер прокинет заголовок x-balance-restore - мы восстановим ему баланс
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
