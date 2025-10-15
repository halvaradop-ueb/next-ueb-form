import { createService, createRequest } from "./utils"
import type {
    EvaluationSummary,
    SubjectPerformance,
    EvaluationFilters,
    ChartDataPoint,
    TimeSeriesPoint,
    QuestionScore,
} from "@/lib/@types/visualization"

export interface EvaluationSummaryResponse {
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

export interface SubjectPerformanceResponse {
    subjectId: string
    subjectName: string
    averageScore: number
    totalEvaluations: number
    professorId?: string
    professorName?: string
}

export const getEvaluationSummary = async (filters?: EvaluationFilters): Promise<EvaluationSummaryResponse> => {
    try {
        const queryParams = new URLSearchParams()

        if (filters?.semester) queryParams.append("semester", filters.semester)
        if (filters?.subjectId) queryParams.append("subjectId", filters.subjectId)
        if (filters?.professorId) queryParams.append("professorId", filters.professorId)
        if (filters?.startDate) queryParams.append("startDate", filters.startDate)
        if (filters?.endDate) queryParams.append("endDate", filters.endDate)

        const request = createRequest("GET", `visualization/summary?${queryParams.toString()}`)
        const result = await createService(request)

        return result.data
    } catch (error) {
        console.error("Error fetching evaluation summary:", error)
        throw error
    }
}

export const getSubjectPerformance = async (subjectId?: string, professorId?: string): Promise<SubjectPerformanceResponse[]> => {
    try {
        const queryParams = new URLSearchParams()

        if (subjectId) queryParams.append("subjectId", subjectId)
        if (professorId) queryParams.append("professorId", professorId)

        const request = createRequest("GET", `visualization/subject-performance?${queryParams.toString()}`)
        const result = await createService(request)

        return result.data
    } catch (error) {
        console.error("Error fetching subject performance:", error)
        throw error
    }
}

export const getEvaluationTrends = async (days: number = 30): Promise<TimeSeriesPoint[]> => {
    try {
        const request = createRequest("GET", `visualization/trends?days=${days}`)
        const result = await createService(request)

        return result.data
    } catch (error) {
        console.error("Error fetching evaluation trends:", error)
        throw error
    }
}

export const getQuestionAnalysis = async (questionId?: string, filters?: EvaluationFilters): Promise<QuestionScore[]> => {
    try {
        const queryParams = new URLSearchParams()

        if (questionId) queryParams.append("questionId", questionId)
        if (filters?.semester) queryParams.append("semester", filters.semester)
        if (filters?.subjectId) queryParams.append("subjectId", filters.subjectId)
        if (filters?.professorId) queryParams.append("professorId", filters.professorId)

        const request = createRequest("GET", `visualization/question-analysis?${queryParams.toString()}`)
        const result = await createService(request)

        return result.data
    } catch (error) {
        console.error("Error fetching question analysis:", error)
        throw error
    }
}

export const getTopPerformers = async (
    type: "professor" | "subject" = "professor",
    limit: number = 10
): Promise<ChartDataPoint[]> => {
    try {
        const request = createRequest("GET", `visualization/top-performers?type=${type}&limit=${limit}`)
        const result = await createService(request)

        return result.data
    } catch (error) {
        console.error("Error fetching top performers:", error)
        throw error
    }
}

// Mock data for development when API is not available
export const getMockEvaluationSummary = (): EvaluationSummaryResponse => {
    return {
        totalEvaluations: 245,
        averageScore: 7.8,
        subjectBreakdown: [
            { name: "Matemáticas", value: 8.2 },
            { name: "Física", value: 7.9 },
            { name: "Química", value: 7.6 },
            { name: "Biología", value: 8.1 },
            { name: "Historia", value: 7.4 },
            { name: "Literatura", value: 8.3 },
        ],
        professorBreakdown: [
            { name: "Dr. García", value: 8.5, category: "Profesor" },
            { name: "Dra. López", value: 8.2, category: "Profesor" },
            { name: "Dr. Martínez", value: 7.9, category: "Profesor" },
            { name: "Dra. Rodríguez", value: 8.1, category: "Profesor" },
            { name: "Dr. Sánchez", value: 7.7, category: "Profesor" },
        ],
        timeSeriesData: [
            { name: "Ene", value: 7.2 },
            { name: "Feb", value: 7.4 },
            { name: "Mar", value: 7.6 },
            { name: "Abr", value: 7.8 },
            { name: "May", value: 7.9 },
            { name: "Jun", value: 8.0 },
        ],
        scoreDistribution: [
            { name: "0-4", value: 15 },
            { name: "5-6", value: 45 },
            { name: "7-8", value: 120 },
            { name: "9-10", value: 65 },
        ],
        topPerformers: [
            { name: "Dr. García", value: 8.5, category: "Profesor" },
            { name: "Dra. López", value: 8.2, category: "Profesor" },
            { name: "Dra. Rodríguez", value: 8.1, category: "Profesor" },
            { name: "Dr. Martínez", value: 7.9, category: "Profesor" },
            { name: "Dr. Sánchez", value: 7.7, category: "Profesor" },
        ],
        trends: {
            direction: "up",
            percentage: 8.5,
            description: "vs mes anterior",
        },
    }
}
