import { vi } from "vitest"

export const routerMock = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
}

export const createNextNavigationMock = (query: Record<string, string> = {}, pathname = "/") => {
    const searchParams = new URLSearchParams(query)

    return {
        useRouter: () => routerMock,
        usePathname: () => pathname,
        useSearchParams: () => searchParams,
        redirect: vi.fn(),
    }
}
