import type { FastifyInstance } from 'fastify'
import type { GiftService } from '../../../service/gift'
import { fetchGifts } from './fetch'
import { fetchUserGifts } from './fetch_user_gifts'

export class GiftHandler {
	private server: FastifyInstance

	protected service: GiftService

	private fetchGifts = fetchGifts
	private fetchUserGifts = fetchUserGifts

	constructor(server: FastifyInstance, service: GiftService) {
		this.server = server
		this.service = service
	}

	setup() {
		this.server.get('/gifts', this.fetchGifts.bind(this))
		this.server.get('/gifts/my', this.fetchUserGifts.bind(this))
	}
}
