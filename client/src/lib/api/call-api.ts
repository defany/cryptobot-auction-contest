import axios, { AxiosHeaders, type Method } from "axios"
import { getUserId } from "@/shared/auth/user-id"

export type ApiError = {
	status: number | null
	message: string
	data?: unknown
}

export type ApiCallShape = {
	request?: {
		body?: unknown
		params?: Record<string, string | number>
		query?: Record<string, string | number | boolean | null | undefined>
		headers?: Record<string, string>
	}
	response?: unknown
}

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	timeout: 30_000,
})

api.interceptors.request.use(config => {
	const userId = getUserId()
	if (!userId) {
		return config
	}

	config.headers = AxiosHeaders.from(config.headers)
	config.headers.set("authorization", `Bearer ${userId}`)

	return config
})

function compilePath(
	path: string,
	params?: Record<string, string | number>,
): string {
	if (!params) return path

	return path.replace(/:([A-Za-z0-9_]+)/g, (_, key: string) => {
		const v = params[key]
		if (v === undefined || v === null) {
			throw new Error(`missing path param: ${key}`)
		}
		return encodeURIComponent(String(v))
	})
}

function toApiError(err: unknown): ApiError {
	if (axios.isAxiosError(err)) {
		return {
			status: err.response?.status ?? null,
			message:
				(err.response?.data as { message?: string })?.message ??
				err.message ??
				"request failed",
			data: err.response?.data,
		}
	}

	return {
		status: null,
		message: err instanceof Error ? err.message : "unknown error",
		data: err,
	}
}

export async function callApi<T extends ApiCallShape>(
	method: Method,
	path: string,
	req?: T["request"],
): Promise<T["response"]> {
	try {
		const url = compilePath(path, req?.params)

		const res = await api.request<T["response"]>({
			method,
			url,
			params: req?.query,
			data: req?.body,
			headers: req?.headers,
		})

		return res.data
	} catch (e) {
		throw toApiError(e)
	}
}