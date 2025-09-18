const isProduction = process.env.NODE_ENV === "production"
export const API_ENDPOINT = isProduction ? process.env.NEXT_PUBLIC_API_ENDPOINT : "http://localhost:4000/api/v1"
