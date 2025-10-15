export interface ChartDataPoint {
    name: string
    value: number
    [key: string]: any
}

export interface TimeSeriesPoint {
    date: string
    value: number
    name?: string
}

export interface QuestionScore {
    questionId: string
    questionText: string
    averageScore: number
    totalResponses: number
    distribution: ChartDataPoint[]
}

export interface EvaluationFilters {
    semester?: string
    subjectId?: string
    professorId?: string
    startDate?: string
    endDate?: string
}

export interface EvaluationSummary {
    totalEvaluations: number
    averageScore: number
    subjectBreakdown: ChartDataPoint[]
    professorBreakdown: ChartDataPoint[]
    timeSeriesData: ChartDataPoint[]
    scoreDistribution: ChartDataPoint[]
    topPerformers: ChartDataPoint[]
    trends: {
        direction: "up" | "down" | "stable"
        percentage: number
        description: string
    }
}

export interface SubjectPerformance {
    subjectId: string
    subjectName: string
    averageScore: number
    totalEvaluations: number
    professorId?: string
    professorName?: string
    trends?: {
        direction: "up" | "down" | "stable"
        percentage: number
    }
}
