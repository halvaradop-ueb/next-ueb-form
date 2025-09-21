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

export const createService = async (request: Request, error?: string) => {
    try {
        const response = await fetch(request)
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${error ?? response.statusText}`)
        }

        if (response.status === 204) {
            return true
        }

        const json = await response.json()
        return json?.data ?? null
    } catch (error) {
        console.error("Error fetching data:", error)
        throw error
    }
}
