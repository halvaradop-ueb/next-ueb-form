import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import QuizzesPage, { metadata } from "@/app/(panel)/dashboard/quizzes/page"

vi.mock("@/ui/quizzes/quizzes", () => ({
    Quizzes: () => <div data-testid="quizzes-page-content">Quizzes Module</div>,
}))

describe("QuizzesPage", () => {
    it("renders the quizzes module", () => {
        render(<QuizzesPage />)

        expect(screen.getByTestId("quizzes-page-content")).toBeInTheDocument()
    })

    it("exposes quizzes metadata", () => {
        expect(metadata.title).toContain("Cuestionarios")
        expect(metadata.description).toContain("administraci")
    })
})
