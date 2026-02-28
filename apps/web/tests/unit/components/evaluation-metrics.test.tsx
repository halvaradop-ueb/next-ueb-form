import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { EvaluationMetrics, type EvaluationSummary } from "@/components/visualization/evaluation-metrics"

vi.mock("@/components/visualization/charts", () => ({
    BarChartComponent: () => <div data-testid="bar-chart" />,
    PieChartComponent: () => <div data-testid="pie-chart" />,
    LineChartComponent: () => <div data-testid="line-chart" />,
    HorizontalBarChartComponent: () => <div data-testid="horizontal-bar-chart" />,
}))

const summary: EvaluationSummary = {
    totalEvaluations: 42,
    averageScore: 8.36,
    subjectBreakdown: [
        { name: "Algorithms", value: 8.8 },
        { name: "Databases", value: 7.9 },
    ],
    professorBreakdown: [
        { name: "Prof A", value: 9.1 },
        { name: "Prof B", value: 8.2 },
    ],
    timeSeriesData: [
        { name: "2025-1", value: 7.8 },
        { name: "2025-2", value: 8.4 },
    ],
    scoreDistribution: [
        { name: "9-10", value: 15 },
        { name: "7-8", value: 20 },
    ],
    topPerformers: [
        { name: "Prof A", value: 9.6, category: "Professor" },
        { name: "Prof B", value: 9.4, category: "Professor" },
        { name: "Prof C", value: 9.2, category: "Professor" },
        { name: "Prof D", value: 9.0, category: "Professor" },
        { name: "Prof E", value: 8.9, category: "Professor" },
        { name: "Prof F", value: 8.7, category: "Professor" },
    ],
    trends: {
        direction: "up",
        percentage: 12.5,
        description: "vs previous term",
    },
}

describe("EvaluationMetrics", () => {
    it("renders summary values and trend label", () => {
        render(<EvaluationMetrics summary={summary} />)

        expect(screen.getByText(/42/)).toBeInTheDocument()
        expect(screen.getByText("8.4")).toBeInTheDocument()
        expect(screen.getByText(/\+12.5% vs previous term/i)).toBeInTheDocument()
        expect(screen.getByText("Prof A")).toBeInTheDocument()
        expect(screen.getByText("Prof E")).toBeInTheDocument()
        expect(screen.queryByText("Prof F")).not.toBeInTheDocument()
    })

    it("renders mocked chart slots", () => {
        render(<EvaluationMetrics summary={summary} />)

        expect(screen.getAllByTestId("horizontal-bar-chart")).toHaveLength(2)
        expect(screen.getByTestId("pie-chart")).toBeInTheDocument()
        expect(screen.getByTestId("line-chart")).toBeInTheDocument()
    })
})
