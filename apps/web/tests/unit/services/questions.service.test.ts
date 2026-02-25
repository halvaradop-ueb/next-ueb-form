import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import type { Question } from "@/lib/@types/services"
import {
    addQuestion,
    getQuestionTitleById,
    getQuestions,
    getQuestionsForStudents,
    getQuestionsForProfessors,
} from "@/services/questions"
import { server } from "../setup"

const API_BASE = "http://localhost:4000/api/v1"

const question: Question = {
    id: "q-1",
    title: "How clear was the class?",
    description: "Rate the clarity",
    question_type: "single_choice",
    required: true,
    target_audience: "student",
    stage_id: "stage-1",
    stage: null,
    options: ["1", "2", "3", "4", "5"],
}

describe("Questions Service", () => {
    it("returns questions when endpoint is successful", async () => {
        server.use(
            http.get(`${API_BASE}/questions`, () => {
                return HttpResponse.json({ questions: [question] })
            })
        )

        const result = await getQuestions()
        expect(result).toEqual([question])
    })

    it("returns empty array when endpoint fails", async () => {
        server.use(
            http.get(`${API_BASE}/questions`, () => {
                return new HttpResponse(null, { status: 500 })
            })
        )

        const result = await getQuestions()
        expect(result).toEqual([])
    })

    it("creates a question with POST", async () => {
        server.use(
            http.post(`${API_BASE}/questions`, async ({ request }) => {
                const payload = (await request.json()) as Question
                return HttpResponse.json(payload, { status: 201 })
            })
        )

        const result = await addQuestion(question)
        expect(result).toEqual(question)
    })

    it("returns grouped student questions payload", async () => {
        server.use(
            http.get(`${API_BASE}/questions`, ({ request }) => {
                const audience = new URL(request.url).searchParams.get("audience")
                if (audience === "student") {
                    return HttpResponse.json({
                        questions: [question],
                        grouped: { "stage-1": [question] },
                    })
                }
                return new HttpResponse(null, { status: 404 })
            })
        )

        const [questions, grouped] = await getQuestionsForStudents()
        expect(questions).toHaveLength(1)
        expect(grouped["stage-1"]).toHaveLength(1)
    })

    it("returns grouped professor questions payload", async () => {
        server.use(
            http.get(`${API_BASE}/questions`, ({ request }) => {
                const audience = new URL(request.url).searchParams.get("audience")
                if (audience === "professor") {
                    return HttpResponse.json({
                        questions: [question],
                        grouped: { "stage-1": [question] },
                    })
                }
                return new HttpResponse(null, { status: 404 })
            })
        )

        const [questions, grouped] = await getQuestionsForProfessors()
        expect(questions).toHaveLength(1)
        expect(grouped["stage-1"]).toHaveLength(1)
    })

    it("returns question title by id", async () => {
        server.use(
            http.get(`${API_BASE}/questions`, ({ request }) => {
                const id = new URL(request.url).searchParams.get("id")
                if (id === "q-1") {
                    return HttpResponse.json({ questions: [question] })
                }
                return HttpResponse.json({ questions: [] })
            })
        )

        const title = await getQuestionTitleById("q-1")
        expect(title).toBe("How clear was the class?")
    })
})
