import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import ReportsPage, { metadata } from "@/app/(panel)/dashboard/reports/page"

vi.mock("@/ui/report/report", () => ({
    Reports: () => <div data-testid="reports-page-content">Reports Module</div>,
}))

describe("ReportsPage", () => {
    it("renders the reports module", () => {
        render(<ReportsPage />)

        expect(screen.getByTestId("reports-page-content")).toBeInTheDocument()
    })

    it("exposes reports metadata", () => {
        expect(metadata.title).toContain("Reportes")
        expect(metadata.description).toContain("administraci")
    })
})
