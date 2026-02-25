import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const { authMock } = vi.hoisted(() => ({
    authMock: vi.fn(),
}))

vi.mock(
    "@/auth",
    () => ({
        auth: authMock,
    }),
    { virtual: true }
)

import { middleware } from "@/middleware"

describe("middleware", () => {
    beforeEach(() => {
        authMock.mockReset()
    })

    it("redirects unauthenticated users to /auth for protected routes", async () => {
        authMock.mockResolvedValue(null)

        const request = new NextRequest("http://localhost/dashboard")
        const response = await middleware(request)

        expect(response.headers.get("location")).toBe("http://localhost/auth")
    })

    it("redirects authenticated users away from /auth to /dashboard", async () => {
        authMock.mockResolvedValue({
            user: { id: "user-1", role: "admin" },
        })

        const request = new NextRequest("http://localhost/auth")
        const response = await middleware(request)

        expect(response.headers.get("location")).toBe("http://localhost/dashboard")
    })

    it("redirects users who try to access a route outside their role", async () => {
        authMock.mockResolvedValue({
            user: { id: "user-2", role: "professor" },
        })

        const request = new NextRequest("http://localhost/dashboard/users")
        const response = await middleware(request)

        expect(response.headers.get("location")).toBe("http://localhost/dashboard")
    })

    it("allows access to authorized routes", async () => {
        authMock.mockResolvedValue({
            user: { id: "user-3", role: "professor" },
        })

        const request = new NextRequest("http://localhost/dashboard/evaluations")
        const response = await middleware(request)

        expect(response.headers.get("x-middleware-next")).toBe("1")
    })
})
