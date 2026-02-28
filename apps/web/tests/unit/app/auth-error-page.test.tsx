import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import AuthError from "@/app/auth/error/page"

const { useSearchParamsMock } = vi.hoisted(() => ({
    useSearchParamsMock: vi.fn(),
}))

vi.mock("next/navigation", () => ({
    useSearchParams: useSearchParamsMock,
}))

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}))

describe("AuthError page", () => {
    beforeEach(() => {
        useSearchParamsMock.mockReturnValue(new URLSearchParams("error=OAuthCallback"))
    })

    it("renders current auth error and login link", () => {
        render(<AuthError />)

        expect(screen.getByText(/authentication error/i)).toBeInTheDocument()
        expect(screen.getByText(/error: oauthcallback/i)).toBeInTheDocument()
        expect(screen.getByRole("link", { name: /back to login/i })).toHaveAttribute("href", "/auth")
    })
})
