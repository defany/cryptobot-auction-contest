import type { FastifyInstance } from 'fastify'
import type { GiftService } from '../../../service/gift'
import { fetchGifts } from './fetch'

export class GiftHandler {
	private server: FastifyInstance

	protected service: GiftService

	private fetchGifts = fetchGifts

	constructor(server: FastifyInstance, service: GiftService) {
		this.server = server
		this.service = service
	}

	setup() {
		this.server.get('/gifts', this.fetchGifts.bind(this))
	}
}
