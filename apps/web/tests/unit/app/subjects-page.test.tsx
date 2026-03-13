import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import SubjectsPage, { metadata } from "@/app/(panel)/dashboard/subjects/page"

vi.mock("@/ui/subjects/subjects", () => ({
    Subjects: () => <div data-testid="subjects-page-content">Subjects Module</div>,
}))

describe("SubjectsPage", () => {
    it("renders the subjects module", () => {
        render(<SubjectsPage />)

        expect(screen.getByTestId("subjects-page-content")).toBeInTheDocument()
    })

    it("exposes subjects metadata", () => {
        expect(metadata.title).toContain("Asignaturas")
        expect(metadata.description).toContain("administraci")
    })
})
