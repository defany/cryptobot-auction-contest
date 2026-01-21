import type { FastifyInstance } from 'fastify'
import type { UserService } from '../../../service/user'
import { fetchBalance } from './fetch_balance'


export class UserHandler {
	private server: FastifyInstance

	protected service: UserService

	fetchBalance = fetchBalance

	constructor(server: FastifyInstance, service: UserService) {
		this.server = server
		this.service = service
	}

	setup() {
		this.server.get('/balances/my', this.fetchBalance.bind(this)) 
	}
}
