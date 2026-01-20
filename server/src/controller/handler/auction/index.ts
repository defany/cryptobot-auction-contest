import type { FastifyInstance } from 'fastify'
import type { AuctionService } from '../../../service/auction'
import { CreateAuctionInSchema } from '../../../service/auction/create'
import {
	CreateBidBodySchema,
	CreateBidParamsSchema,
} from '../../../service/auction/create_bid'
import {
	FetchAuctionByIdInParamsSchema
} from '../../../service/auction/fetch_by_id'
import { FetchTopBidsParamsSchema } from '../../../service/auction/fetch_top_bids'
import { create } from './create'
import { createBid } from './create_bid'
import { fetchById } from './fetch_by_id'
import { fetchTopBids } from './fetch_top_bids'

export class AuctionHandler {
	private server: FastifyInstance
	protected service: AuctionService

	create = create
	createBid = createBid
	fetchById = fetchById
	fetchTopBids = fetchTopBids

	constructor(server: FastifyInstance, service: AuctionService) {
		this.server = server
		this.service = service
	}

	setup() {
		this.server.post(
			'/auctions/:auction_id/bids',
			{
				schema: {
					params: CreateBidParamsSchema,
					body: CreateBidBodySchema,
				},
			},
			this.createBid.bind(this),
		)

		this.server.post(
			'/auctions',
			{
				schema: {
					body: CreateAuctionInSchema,
				},
			},
			this.create.bind(this),
		)

		this.server.get(
			'/auctions/:auction_id',
			{
				schema: {
					params: FetchAuctionByIdInParamsSchema,
				},
			},
			this.fetchById.bind(this),
		)

		this.server.get(
			'/auctions/:auction_id/bids/top',
			{
				schema: {
					params: FetchTopBidsParamsSchema,
				},
			},
			this.fetchTopBids.bind(this),
		)
	}
}
