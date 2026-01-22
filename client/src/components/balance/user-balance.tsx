import { callApi } from '@/lib/api/call-api'
import { useEffect, useMemo, useRef, useState } from 'react'

type BalanceResponse = {
	amount: number
}

type Props = {
	className?: string
	title?: string
	pollMs?: number
}

function formatCompactNumber(n: number) {
	try {
		return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)
	} catch {
		return String(n)
	}
}

function toNumberAmount(v: unknown): number | null {
	if (typeof v === 'number') return Number.isFinite(v) ? v : null
	if (typeof v === 'string') {
		const n = Number(v)
		return Number.isFinite(n) ? n : null
	}
	return null
}

export function UserBalance({ className, title = 'Balance', pollMs = 4000 }: Props) {
	const [amount, setAmount] = useState<number | null>(null)
	const [loading, setLoading] = useState(true)

	const inFlightRef = useRef(false)

	const amountText = useMemo(() => {
		if (amount == null) return '—'
		return `⭐ ${formatCompactNumber(amount)}`
	}, [amount])

	async function load(restoreDelta?: number): Promise<void> {
		if (inFlightRef.current) return
		inFlightRef.current = true

		try {
			const headers =
				typeof restoreDelta === 'number'
					? { 'x-balance-restore': String(restoreDelta) }
					: undefined

			const res = await callApi<{ response: BalanceResponse }>('GET', '/balances/my', {
				headers: headers
			})

			const raw = res.amount
			const n = toNumberAmount(raw)

			if (n == null) return
			setAmount(n)
		} finally {
			setLoading(false)
			inFlightRef.current = false
		}
	}

	useEffect(() => {
		let cancelled = false

		const run = async () => {
			if (cancelled) return
			await load()
		}

		run()

		const id = setInterval(() => {
			if (cancelled) return
			load().catch(() => {})
		}, pollMs)

		return () => {
			cancelled = true
			clearInterval(id)
		}
	}, [pollMs])

	const dec = 500
	const disableDecrease =
		inFlightRef.current ||
		amount == null ||
		amount - dec < 0

	return (
		<div className={className}>
			<div className="text-xs text-muted-foreground">{title}</div>

			<div className="flex items-center gap-2">
				<div className="text-lg font-semibold tabular-nums">
					{loading && amount == null ? 'Loading…' : amountText}
				</div>

				<div className="flex items-center gap-1">
					<button
						type="button"
						className="h-8 px-2 rounded-md border text-sm leading-none disabled:opacity-50"
						onClick={() => load(-dec).catch(() => {})}
						disabled={disableDecrease}
						title="-500"
					>
						−500
					</button>
					<button
						type="button"
						className="h-8 px-2 rounded-md border text-sm leading-none disabled:opacity-50"
						onClick={() => load(500).catch(() => {})}
						disabled={inFlightRef.current}
						title="+500"
					>
						+500
					</button>
				</div>
			</div>
		</div>
	)
}