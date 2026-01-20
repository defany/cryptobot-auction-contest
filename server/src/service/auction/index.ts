import type { PrismaClient } from '../../../generated/prisma/client'
import type { AuctionRepo } from '../../repo/auction'
import type { BidRepo } from '../../repo/bid'
import type { UserRepo } from '../../repo/user'
import { create } from './create'
import { createBid } from './create_bid'
import { fetchById } from './fetch_by_id'
import { fetchTopBids } from './fetch_top_bids'

export class AuctionService {
	protected auctionProvider: AuctionRepo
	protected bidProvider: BidRepo
	protected userProvider: UserRepo

	protected db: PrismaClient

	fetchById = fetchById
	create = create
	fetchTopBids = fetchTopBids
	createBid = createBid

	constructor(db: PrismaClient, auctionProvider: AuctionRepo, bidProvider: BidRepo, userProvider: UserRepo) {
		this.db = db
		this.auctionProvider = auctionProvider
		this.bidProvider = bidProvider 
		this.userProvider = userProvider
	}
}
