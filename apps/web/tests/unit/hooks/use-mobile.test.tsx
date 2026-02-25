import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useIsMobile } from "@/hooks/use-mobile"
import { setupMatchMedia } from "../test-utils/match-media"

describe("useIsMobile", () => {
    it("returns false when viewport is desktop sized", () => {
        setupMatchMedia(1280)

        const { result } = renderHook(() => useIsMobile())

        expect(result.current).toBe(false)
    })

    it("returns true when viewport is mobile sized", () => {
        setupMatchMedia(375)

        const { result } = renderHook(() => useIsMobile())

        expect(result.current).toBe(true)
    })

    it("updates when the viewport width changes", () => {
        const { setWidth } = setupMatchMedia(1280)
        const { result } = renderHook(() => useIsMobile())

        expect(result.current).toBe(false)

        act(() => {
            setWidth(640)
        })

        expect(result.current).toBe(true)
    })
})
