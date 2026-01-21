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

		setNowMs(Date.now())

		const id = setInterval(() => {
			setNowMs(Date.now())
		}, 1000)

		return () => clearInterval(id)
	}, [expiresAtMs])

	const leftMs = expiresAtMs ? expiresAtMs - nowMs : null

	const leftSec = leftMs === null ? null : Math.max(0, Math.floor(leftMs / 1000))
	const mm =
		leftSec === null ? null : String(Math.floor(leftSec / 60)).padStart(2, '0')
	const ss = leftSec === null ? null : String(leftSec % 60).padStart(2, '0')

	return {
		leftMs,
		leftSec,
		formatted: leftSec === null ? null : `${mm}:${ss}`,
		isExpired: leftSec !== null && leftSec === 0,
	}
}