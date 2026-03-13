import { afterAll, afterEach, beforeAll, vi } from "vitest"
import { setupServer } from "msw/node"
import { cleanup } from "@testing-library/react"
import "@testing-library/jest-dom"

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key"

export const server = setupServer()

beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" })
})

afterEach(() => {
    cleanup()
    server.resetHandlers()
    vi.restoreAllMocks()
})

afterAll(() => {
    server.close()
})
