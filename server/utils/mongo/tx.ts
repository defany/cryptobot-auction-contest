import type { PrismaClient } from '../../generated/prisma/client'
import type { QueryExecutor } from '../../types/prisma'

type RunTxWithRetryOpts = {
	maxAttempts?: number
	baseDelayMs?: number
	maxDelayMs?: number
	/* 
		Если две параллельные транзакции словили дедлок, то запускаем их через разное время, чтобы они опять не словили дедлок, очевидно
	*/
	jitterRatio?: number
	deadlineMs?: number
	txOptions?: {
		maxWait?: number
		timeout?: number
		isolationLevel?: any
	}
	isRetryable?: (err: unknown, attempt: number) => boolean
	onRetry?: (info: { attempt: number; delayMs: number; err: unknown }) => void
}

function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms))
}

function nowMs(): number {
	return Date.now()
}

function clamp(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, n))
}

function backoffDelayMs(
	attempt: number,
	baseDelayMs: number,
	maxDelayMs: number,
	jitterRatio: number,
): number {
	const exp = baseDelayMs * Math.pow(2, Math.max(0, attempt - 1))
	const capped = Math.min(exp, maxDelayMs)
	const jitter = capped * clamp(jitterRatio, 0, 1) * (Math.random() * 2 - 1)
	return Math.max(0, Math.round(capped + jitter))
}

function defaultIsRetryable(err: unknown): boolean {
	const e: any = err
	const code = String(e?.code ?? '')
	const name = String(e?.name ?? '')
	const message = String(e?.message ?? '')
	const meta = e?.meta

	if (code === 'P2028') return true

	if (code === '40001') return true
	if (code === '40P01') return true
	if (code === '55P03') return true

	if (message.includes('Transaction already closed')) return true
	if (
		message.toLowerCase().includes('transaction') &&
		message.toLowerCase().includes('timeout')
	)
		return true
	if (
		message.toLowerCase().includes('deadline') &&
		message.toLowerCase().includes('exceeded')
	)
		return true

	if (message.includes('TransientTransactionError')) return true
	if (message.includes('UnknownTransactionCommitResult')) return true
	if (message.includes('WriteConflict')) return true

	if (code === 'ECONNRESET') return true
	if (code === 'ETIMEDOUT') return true
	if (code === 'EPIPE') return true
	if (code === 'ECONNREFUSED') return true
	if (
		message.toLowerCase().includes('socket') &&
		message.toLowerCase().includes('hang up')
	)
		return true

	if (name.includes('PrismaClientRustPanicError')) return false
	if (name.includes('PrismaClientValidationError')) return false

	if (meta && typeof meta === 'object') {
		const m = String((meta as any)?.cause ?? '')
		if (m.includes('ECONNRESET') || m.includes('ETIMEDOUT')) return true
	}

	return false
}

export async function runTx<TOut>(
	prisma: PrismaClient,
	fn: (tx: QueryExecutor) => Promise<TOut>,
	opts: RunTxWithRetryOpts = {},
): Promise<TOut> {
	const maxAttempts = opts.maxAttempts ?? 4
	const baseDelayMs = opts.baseDelayMs ?? 50
	const maxDelayMs = opts.maxDelayMs ?? 1_500
	const jitterRatio = opts.jitterRatio ?? 0.3
	const deadlineMs = opts.deadlineMs ?? 8 * 1_000

	const startedAt = nowMs()
	let lastErr: unknown

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		if (deadlineMs > 0 && nowMs() - startedAt > deadlineMs) break

		try {
			const txOptions = opts.txOptions ?? {}

			const out = await prisma.$transaction(fn, txOptions)

			return out
		} catch (err) {
			lastErr = err

			const retryable =
				typeof opts.isRetryable === 'function'
					? opts.isRetryable(err, attempt)
					: defaultIsRetryable(err)

			const isLastAttempt = attempt >= maxAttempts
			if (!retryable || isLastAttempt) throw err

			const delayMs = backoffDelayMs(
				attempt,
				baseDelayMs,
				maxDelayMs,
				jitterRatio,
			)
			if (opts.onRetry) opts.onRetry({ attempt, delayMs, err })

			if (deadlineMs > 0) {
				const elapsed = nowMs() - startedAt
				if (elapsed + delayMs > deadlineMs) throw err
			}

			if (delayMs > 0) await sleep(delayMs)
		}
	}

	throw lastErr
}