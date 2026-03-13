const isProduction = process.env.NODE_ENV === "production"

export const API_ENDPOINT =
    isProduction && process.env.NEXT_PUBLIC_API_ENDPOINT ? process.env.NEXT_PUBLIC_API_ENDPOINT : "http://localhost:4000/api/v1"

export const createRequest = (method: "GET" | "POST" | "PUT" | "DELETE", url: string, body?: any) => {
    const data = typeof body === "object" && !(body instanceof FormData) ? JSON.stringify(body) : body
    const request = new Request(`${API_ENDPOINT}/${url}`, {
        method,
        mode: "cors",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: data,
    })
    return request
}

const roundToTwoDecimals = (value: number) => {
    if (Number.isInteger(value)) return value
    const factor = 100
    return Math.round((value + Math.sign(value) * Number.EPSILON) * factor) / factor
}

export const roundNumericValues = <T>(value: T): T => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return roundToTwoDecimals(value) as T
    }

    if (Array.isArray(value)) {
        return value.map((item) => roundNumericValues(item)) as T
    }

    if (value && typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
            key,
            roundNumericValues(nestedValue),
        ])

        return Object.fromEntries(entries) as T
    }

    return value
}

export const createService = async (request: Request, error?: string) => {
    try {
        const response = await fetch(request)
        if (response.status >= 400) {
            const responseText = await response.text()
            console.error("API Response Error:", {
                status: response.status,
                statusText: response.statusText,
                body: responseText,
            })
            throw new Error(`Failed to fetch: ${error ?? response.statusText}`)
        }
        const json = await response.json()
        return roundNumericValues(json)
    } catch (error) {
        console.error("Error fetching data:", error)
        throw error
    }
}
