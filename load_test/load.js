import http from 'k6/http'
import { check, group, sleep, fail } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const GIFT_ID = __ENV.GIFT_ID || '69716f9cb948017f8e0e5c40'

const USERS_COUNT = Number(__ENV.USERS_COUNT || 300)
const USER_ID_START = Number(__ENV.USER_ID_START || 100000)

const BID_RPS_START = Number(__ENV.BID_RPS_START || 20)
const BID_RPS_PEAK = Number(__ENV.BID_RPS_PEAK || 400)

const BID_INC_MIN = Number(__ENV.BID_INC_MIN || 1)
const BID_INC_MAX = Number(__ENV.BID_INC_MAX || 5)

const TIMEOUT_READ = __ENV.TIMEOUT_READ || '15s'
const TIMEOUT_WRITE = __ENV.TIMEOUT_WRITE || '20s'

const SETUP_RACE_BATCH = Number(__ENV.SETUP_RACE_BATCH || 40)
const SETUP_RACE_RETRIES = Number(__ENV.SETUP_RACE_RETRIES || 5)
const SETUP_RACE_SLEEP_MS = Number(__ENV.SETUP_RACE_SLEEP_MS || 150)

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

function createAuctionPayload() {
  return {
    gift_id: GIFT_ID,
    supply: 9000,
    winners_per_round: 100,
    round_duration_sec: 60,
    antisniping_settings: {
      extensionDurationSec: 10,
      thresholdSec: 3,
      maxExtensions: 5,
    },
  }
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

function runCreateAuctionRaceOnce() {
  const reqs = []
  for (let i = 0; i < SETUP_RACE_BATCH; i++) {
    const userId = pickUserId()
    reqs.push([
      'POST',
      `${BASE_URL}/auctions`,
      JSON.stringify(createAuctionPayload()),
      jsonHeadersFor(userId, false),
    ])
  }

  const resps = http.batch(reqs)

  for (const res of resps) {
    if (res.status >= 200 && res.status < 400) continue

    if (res.status === 409) {
      const body = readErr(res)
      const ok =
        body &&
        (body.code === 'ErrAnotherActiveAuction' ||
          body.message === 'Another auction is in action, please wait')
      if (!ok) {
        fail(`setup race: unexpected 409 body=${String(res.body).slice(0, 700)}`)
      }
      continue
    }

    if (res.status === 422) {
      const body = readErr(res)
      const ok = body && body.code === 'ValidationError'
      if (!ok) {
        fail(`setup race: unexpected 422 body=${String(res.body).slice(0, 700)}`)
      }
      continue
    }

    if (res.status === 401 || res.status === 403) {
      continue
    }

    fail(`setup race: unexpected status=${res.status} body=${String(res.body).slice(0, 700)}`)
  }
}

function getAuctionIdOrFail() {
  const userId = pickUserId()
  const id = findAuctionIdFromGifts(userId)
  if (!id) fail(`setup: auction id not found in GET /gifts for gift_id=${GIFT_ID}`)
  return id
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
  group('setup: create auction race (once)', () => {
    for (let i = 0; i < SETUP_RACE_RETRIES; i++) {
      const existing = findAuctionIdFromGifts(pickUserId())
      if (existing) return { auctionId: existing }

      runCreateAuctionRaceOnce()

      const after = findAuctionIdFromGifts(pickUserId())
      if (after) return { auctionId: after }

      sleep(SETUP_RACE_SLEEP_MS / 1000)
    }
  })

  const auctionId = getAuctionIdOrFail()
  return { auctionId }
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

    const body = readErr(bidRes)

    if (bidRes.status === 422) {
      const ok = body && body.code === 'ValidationError'
      const chk = check(bidRes, { 'POST /auctions/:id/bids: expected error ok': () => Boolean(ok) })
      if (!chk) fail(`POST /auctions/:id/bids unexpected 422: body=${String(bidRes.body).slice(0, 700)}`)
      return
    }

    if (bidRes.status === 404) {
      const ok =
        body &&
        (body.code === 'ErrAuctionNotFound' || body.code === 'ErrUserNotFound' ||
          body.message === 'Auction not found' || body.message === 'User not found')
      const chk = check(bidRes, { 'POST /auctions/:id/bids: expected error ok': () => Boolean(ok) })
      if (!chk) fail(`POST /auctions/:id/bids unexpected 404: body=${String(bidRes.body).slice(0, 700)}`)
      return
    }

    if (bidRes.status === 409) {
      const ok =
        body &&
        (body.code === 'ErrInactiveAuction' ||
          body.code === 'ErrTooSmallBid' ||
          body.code === 'ErrInsufficientFunds' ||
          body.message === 'Auction is not active' ||
          body.message === 'Bid is too small' ||
          body.message === 'Insufficient funds')
      const chk = check(bidRes, { 'POST /auctions/:id/bids: expected error ok': () => Boolean(ok) })
      if (!chk) fail(`POST /auctions/:id/bids unexpected 409: body=${String(bidRes.body).slice(0, 700)}`)
      return
    }

    if (bidRes.status === 400) {
      const chk = check(bidRes, { 'POST /auctions/:id/bids: expected error ok': () => true })
      if (!chk) fail(`POST /auctions/:id/bids unexpected 400: body=${String(bidRes.body).slice(0, 700)}`)
      return
    }

    fail(`POST /auctions/:id/bids unexpected: status=${bidRes.status} body=${String(bidRes.body).slice(0, 700)}`)
  })

  sleep(0.05)
}