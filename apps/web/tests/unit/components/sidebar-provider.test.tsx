import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { renderWithSidebar } from "../test-utils/render-with-sidebar"

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}))

const SidebarState = () => {
    const { state } = useSidebar()
    return <span data-testid="sidebar-state">{state}</span>
}

describe("SidebarProvider / useSidebar", () => {
    it("throws when useSidebar is used outside SidebarProvider", () => {
        const BadConsumer = () => {
            useSidebar()
            return null
        }

        expect(() => render(<BadConsumer />)).toThrow("useSidebar must be used within a SidebarProvider.")
    })

    it("toggles open state when trigger is clicked", () => {
        renderWithSidebar(
            <>
                <SidebarTrigger />
                <SidebarState />
            </>,
            true
        )

        expect(screen.getByTestId("sidebar-state")).toHaveTextContent("expanded")

        fireEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }))

        expect(screen.getByTestId("sidebar-state")).toHaveTextContent("collapsed")
        expect(document.cookie).toContain("sidebar_state=false")
    })

    it("supports ctrl+b keyboard shortcut to toggle the sidebar", () => {
        renderWithSidebar(<SidebarState />, true)
        expect(screen.getByTestId("sidebar-state")).toHaveTextContent("expanded")

        fireEvent.keyDown(window, { key: "b", ctrlKey: true })

        expect(screen.getByTestId("sidebar-state")).toHaveTextContent("collapsed")
    })
})
