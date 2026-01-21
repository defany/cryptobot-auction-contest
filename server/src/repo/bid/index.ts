import type { QueryExecutor } from '../../../types/prisma'
import { closeBids } from './close_bid'
import { createBid } from './create_bid'
import { fetchLowestWinningBid } from './fetch_lowest_winning_bid'
import { fetchCountByStatus } from './fetch_pending_bids'
import { fetchTopBids } from './fetch_top_bids'
import { fetchUserBid } from './fetch_user_bid'
import { fetchUserPlaceInTop } from './fetch_user_bid_top_place'
import { refundBidsToUsersBalance } from './refund_bids'

export class BidRepo {
	protected db: QueryExecutor

	createBid = createBid
	fetchTopBids = fetchTopBids
	fetchUserBid = fetchUserBid
	fetchLowestWinningBid = fetchLowestWinningBid
	fetchUserPlaceInTop = fetchUserPlaceInTop
	closeBids = closeBids
	refundBidsToUsersBalance = refundBidsToUsersBalance
	fetchCountByStatus = fetchCountByStatus

	constructor(db: QueryExecutor) {
		this.db = db
	}

	withTx(tx: QueryExecutor): BidRepo {
		return new BidRepo(tx)
	}
}
