import { beforeAll, afterEach, afterAll } from "vitest"
import { setupServer } from "msw/node"
import "@testing-library/jest-dom"

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key"

export const server = setupServer()

beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" })
})

afterEach(() => {
    server.resetHandlers()
})

afterAll(() => {
    server.close()
})
