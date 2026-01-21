function hashToHue(input: string) {
	let h = 0
	for (let i = 0; i < input.length; i++) {
		h = (h * 31 + input.charCodeAt(i)) >>> 0
	}
	return h % 360
}

export function UserAvatar({
	id,
	size = 36,
}: {
	id: number | string
	size?: number
}) {
	const hue = hashToHue(String(id))

	return (
		<div
			style={{
				width: size,
				height: size,
				backgroundColor: `hsl(${hue} 35% 30%)`,
			}}
			className="flex items-center justify-center rounded-full text-xs font-semibold text-white/90"
		>
			{String(id).slice(-2)}
		</div>
	)
}