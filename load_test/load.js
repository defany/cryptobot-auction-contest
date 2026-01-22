import http from 'k6/http'
import { check, group, sleep, fail } from 'k6'

const BASE_URL = 'http://localhost:3000'
const GIFT_ID = '69716f9cb948017f8e0e5c40'

const USERS_COUNT = 300
const USER_ID_START = 100000

const CREATE_RACE_RPS_START = 5
const CREATE_RACE_RPS_PEAK = 80

const BID_RPS_START = 20
const BID_RPS_PEAK = 400

const BID_INC_MIN = 1
const BID_INC_MAX = 5

const TIMEOUT_READ = '15s'
const TIMEOUT_WRITE = '20s'

function j(res) {
  try {
    return res.json()
  } catch {
    return null
  }
}

function pickUserId() {
  const n = Math.floor(Math.random() * USERS_COUNT)
  return String(USER_ID_START + n)
}

function headersFor(userId, restore = false) {
  const h = { Authorization: `Bearer ${userId}` }
  if (restore) h['x-balance-restore'] = 'true'
  return { headers: h, timeout: TIMEOUT_READ }
}

function jsonHeadersFor(userId, restore = false) {
  const h = { Authorization: `Bearer ${userId}`, 'Content-Type': 'application/json' }
  if (restore) h['x-balance-restore'] = 'true'
  return { headers: h, timeout: TIMEOUT_WRITE }
}

function mustOk(res, name) {
  const ok = check(res, {
    [`${name}: status 2xx/3xx`]: r => r.status >= 200 && r.status < 400,
  })
  if (!ok) fail(`${name} failed: status=${res.status} body=${String(res.body).slice(0, 700)}`)
}

function readErr(res) {
  const data = j(res)
  if (!data || typeof data !== 'object') return null

  const code = typeof data.code === 'string' ? data.code : null
  const message = typeof data.message === 'string' ? data.message : ''
  if (!code && !message) return null

  return { code, message, raw: data }
}

function expectError(res, expectedStatus, allowedCodes, allowedMessages, name) {
  const body = readErr(res)
  const ok =
    res.status === expectedStatus &&
    Boolean(
      body &&
        ((body.code && allowedCodes && allowedCodes.includes(body.code)) ||
          (!body.code && allowedMessages && allowedMessages.includes(body.message))),
    )

  const chk = check(res, { [`${name}: expected error ok`]: () => ok })
  if (!chk) {
    fail(`${name} unexpected: status=${res.status} body=${String(res.body).slice(0, 700)}`)
  }
}

function createAuctionPayload() {
  const payload = {
    gift_id: GIFT_ID,
    supply: 9000,
    winners_per_round: 100,
    round_duration_sec: 60,
  }

  if (Math.random() < 0.5) {
    payload.antisniping_settings = {
      extensionDurationSec: 10,
      thresholdSec: 3,
      maxExtensions: 5,
    }
  }

  return payload
}

function findAuctionIdFromGifts(userId) {
  const res = http.get(`${BASE_URL}/gifts`, headersFor(userId, false))
  if (res.status < 200 || res.status >= 400) return null

  const data = j(res)
  const gifts = data?.gifts
  if (!Array.isArray(gifts)) return null

  const gift = gifts.find(g => g?.id === GIFT_ID)
  const auctions = gift?.auctions
  if (!Array.isArray(auctions) || auctions.length === 0) return null

  const a0 = auctions[0]
  return a0?.id || null
}

function createAuctionTry(userId) {
  const res = http.post(
    `${BASE_URL}/auctions`,
    JSON.stringify(createAuctionPayload()),
    jsonHeadersFor(userId, false),
  )

  if (res.status >= 200 && res.status < 400) {
    const data = j(res)
    const id = data?.auction_id
    if (!id) fail('POST /auctions: auction_id not found')
    return { ok: true, auctionId: id }
  }

  return { ok: false, status: res.status, body: String(res.body).slice(0, 700) }
}

function getOrCreateAuctionId() {
  const userId = pickUserId()

  const existing = findAuctionIdFromGifts(userId)
  if (existing) return existing

  const attempt = createAuctionTry(userId)
  if (attempt.ok) return attempt.auctionId

  const after = findAuctionIdFromGifts(userId)
  if (after) return after

  fail(`setup: cannot obtain auction id. create status=${attempt.status} body=${attempt.body}`)
}

function parseAmount(v) {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getMinBidFromAuction(auctionRes) {
  const data = j(auctionRes)
  const mb = data?.minimal_bid
  const amount = parseAmount(mb?.amount)
  if (amount === null) return 0
  return amount
}

export const options = {
  scenarios: {
    create_auctions_race: {
      executor: 'ramping-arrival-rate',
      startRate: CREATE_RACE_RPS_START,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 2000,
      stages: [
        { target: CREATE_RACE_RPS_START, duration: '15s' },
        { target: 20, duration: '20s' },
        { target: 40, duration: '20s' },
        { target: CREATE_RACE_RPS_PEAK, duration: '25s' },
        { target: 0, duration: '10s' },
      ],
      exec: 'createAuctionRace',
    },
    bid_storm: {
      executor: 'ramping-arrival-rate',
      startRate: BID_RPS_START,
      timeUnit: '1s',
      preAllocatedVUs: 300,
      maxVUs: 5000,
      stages: [
        { target: BID_RPS_START, duration: '20s' },
        { target: 50, duration: '20s' },
        { target: 100, duration: '20s' },
        { target: 200, duration: '20s' },
        { target: BID_RPS_PEAK, duration: '30s' },
        { target: 0, duration: '15s' },
      ],
      exec: 'bidStorm',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
}

export function setup() {
  const auctionId = getOrCreateAuctionId()
  return { auctionId }
}

export function createAuctionRace() {
  const userId = pickUserId()

  group('race: create auctions same gift', () => {
    const res = http.post(
      `${BASE_URL}/auctions`,
      JSON.stringify(createAuctionPayload()),
      jsonHeadersFor(userId, false),
    )

    if (res.status >= 200 && res.status < 400) {
      const data = j(res)
      if (!data?.auction_id) fail('POST /auctions (race): auction_id not found')
      return
    }

    if (res.status === 422) {
      expectError(res, 422, ['ValidationError'], null, 'POST /auctions (race)')
      return
    }

    if (res.status === 404) {
      expectError(res, 404, ['ErrAuctionNotFound'], ['Auction not found'], 'POST /auctions (race)')
      return
    }

    if (res.status === 409) {
      expectError(
        res,
        409,
        ['ErrAnotherActiveAuction'],
        ['Another auction is in action, please wait'],
        'POST /auctions (race)',
      )
      return
    }

    if (res.status === 400) {
      expectError(res, 400, null, null, 'POST /auctions (race)')
      return
    }

    fail(`POST /auctions (race) unexpected: status=${res.status} body=${String(res.body).slice(0, 700)}`)
  })
}

export function bidStorm(data) {
  const auctionId = data.auctionId
  const userId = pickUserId()
  const restore = Math.random() < 0.02

  group('storm: batch + bid', () => {
    const batch = http.batch([
      ['GET', `${BASE_URL}/gifts`, null, headersFor(userId, restore)],
      ['GET', `${BASE_URL}/gifts/my`, null, headersFor(userId, restore)],
      ['GET', `${BASE_URL}/auctions/${auctionId}`, null, headersFor(userId, restore)],
      ['GET', `${BASE_URL}/auctions/${auctionId}/bids/top`, null, headersFor(userId, restore)],
    ])

    mustOk(batch[0], 'GET /gifts')
    mustOk(batch[1], 'GET /gifts/my')
    mustOk(batch[2], 'GET /auctions/:id')
    mustOk(batch[3], 'GET /auctions/:id/bids/top')

    const minBid = getMinBidFromAuction(batch[2])
    const inc = randInt(BID_INC_MIN, BID_INC_MAX)
    const amount = String(minBid + inc)

    const bidRes = http.post(
      `${BASE_URL}/auctions/${auctionId}/bids`,
      JSON.stringify({ amount }),
      jsonHeadersFor(userId, restore),
    )

    if (bidRes.status >= 200 && bidRes.status < 400) return

    if (bidRes.status === 422) {
      expectError(bidRes, 422, ['ValidationError'], null, 'POST /auctions/:id/bids')
      return
    }

    if (bidRes.status === 404) {
      expectError(
        bidRes,
        404,
        ['ErrAuctionNotFound', 'ErrUserNotFound'],
        ['Auction not found', 'User not found'],
        'POST /auctions/:id/bids',
      )
      return
    }

    if (bidRes.status === 409) {
      expectError(
        bidRes,
        409,
        ['ErrInactiveAuction', 'ErrTooSmallBid', 'ErrInsufficientFunds'],
        ['Auction is not active', 'Bid is too small', 'Insufficient funds'],
        'POST /auctions/:id/bids',
      )
      return
    }

    if (bidRes.status === 400) {
      expectError(bidRes, 400, null, null, 'POST /auctions/:id/bids')
      return
    }

    fail(`POST /auctions/:id/bids unexpected: status=${bidRes.status} body=${String(bidRes.body).slice(0, 700)}`)
  })

  sleep(0.05)
}