import { useEffect, useMemo, useState } from 'react'

export function useCountdown(expiresAtIso: string | null) {
	const expiresAtMs = useMemo(() => {
		if (!expiresAtIso) return null
		const ms = new Date(expiresAtIso).getTime()
		return Number.isFinite(ms) ? ms : null
	}, [expiresAtIso])

	const [nowMs, setNowMs] = useState(() => Date.now())

	useEffect(() => {
		if (!expiresAtMs) return

		const id = setInterval(() => {
			setNowMs(Date.now())
		}, 1000)

		return () => clearInterval(id)
	}, [expiresAtMs])

	const leftMs = expiresAtMs != null ? expiresAtMs - nowMs : null
	const leftSec =
		leftMs == null ? null : Math.max(0, Math.floor(leftMs / 1000))

	return {
		leftMs,
		leftSec,
		isExpired: leftSec === 0,
	}
}