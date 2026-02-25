import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import FeedbackPage, { metadata } from "@/app/(panel)/dashboard/feedback/page"

vi.mock("@/ui/feedback/feedback", () => ({
    FeedbackManagement: () => <div data-testid="feedback-page-content">Feedback Module</div>,
}))

describe("FeedbackPage", () => {
    it("renders the feedback module", () => {
        render(<FeedbackPage />)

        expect(screen.getByTestId("feedback-page-content")).toBeInTheDocument()
    })

    it("exposes feedback metadata", () => {
        expect(metadata.title).toContain("Retroalimentación")
        expect(metadata.description).toContain("administraci")
    })
})
