import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import StagesPage, { metadata } from "@/app/(panel)/dashboard/stages/page"

vi.mock("@/ui/stages/stages", () => ({
    Stages: () => <div data-testid="stages-page-content">Stages Module</div>,
}))

describe("StagesPage", () => {
    it("renders the stages module", () => {
        render(<StagesPage />)

        expect(screen.getByTestId("stages-page-content")).toBeInTheDocument()
    })

    it("exposes stages metadata", () => {
        expect(metadata.title).toContain("Etapas")
        expect(metadata.description).toContain("administración")
    })
})
