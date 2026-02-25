import { describe, expect, it } from "vitest"
import type { Feedback, Question } from "@/lib/@types/services"
import type { User } from "@ueb/types/user"
import {
    createQuestionSchema,
    defaultAnswer,
    filterByPeriod,
    formatSemester,
    generateSchema,
    getAverageRatings,
    ratingFeedback,
    searchUser,
} from "@/lib/utils"

const createQuestion = (question_type: Question["question_type"]): Question =>
    ({
        id: `question-${question_type}`,
        title: `Question ${question_type}`,
        question_type,
        required: true,
        target_audience: "student",
        stage_id: "stage-1",
        stage: { id: "stage-1", name: "Stage 1" },
        options: question_type.includes("choice") ? ["A", "B"] : null,
    }) as Question

describe("lib/utils", () => {
    it("returns expected default answers by question type", () => {
        expect(defaultAnswer(createQuestion("text"))).toBe("")
        expect(defaultAnswer(createQuestion("numeric"))).toBe(0)
        expect(defaultAnswer(createQuestion("single_choice"))).toBe("")
        expect(defaultAnswer(createQuestion("multiple_choice"))).toEqual([])
    })

    it("calculates rating distribution including empty input", () => {
        const feedback = [{ rating: 1 }, { rating: 3 }, { rating: 5 }, { rating: 5 }] as Feedback[]

        const distribution = ratingFeedback(feedback)
        expect(distribution).toHaveLength(5)
        expect(distribution[0]).toEqual({ rating: 1, percentage: "25.00" })
        expect(distribution[4]).toEqual({ rating: 5, percentage: "50.00" })
        expect(ratingFeedback([])[0]).toEqual({ rating: 1, percentage: "0" })
    })

    it("calculates average ratings and handles no data", () => {
        expect(getAverageRatings([] as Feedback[])).toBe(0)
        expect(getAverageRatings([{ rating: 4 }, { rating: 2 }] as Feedback[])).toBe(3)
    })

    it("filters feedback by period boundaries", () => {
        const feedback = [
            { feedback_date: "2025-01-10T00:00:00.000Z" },
            { feedback_date: "2025-02-15T00:00:00.000Z" },
            { feedback_date: "2024-12-31T00:00:00.000Z" },
        ] as Feedback[]

        const result = filterByPeriod(feedback, "2025-01-01 - 2025-02-28")
        expect(result).toHaveLength(2)
    })

    it("formats semester ranges and preserves invalid values", () => {
        expect(formatSemester("2025-02-01 - 2025-06-30")).toBe("2025-1")
        expect(formatSemester("2025-08-01 - 2025-12-31")).toBe("2025-2")
        expect(formatSemester("bad-value")).toBe("bad-value")
    })

    it("builds question schemas with validation rules", () => {
        const numericSchema = createQuestionSchema(createQuestion("numeric"))
        expect(() => numericSchema.parse("6")).toThrow()
        expect(numericSchema.parse("5")).toBe("5")

        const generatedSchema = generateSchema([createQuestion("text"), createQuestion("multiple_choice")])
        const parsed = generatedSchema.parse({
            "question-text": "answer",
            "question-multiple_choice": ["A"],
        })

        expect(parsed["question-text"]).toBe("answer")
    })

    it("filters users by role and search term", () => {
        const users = [
            { first_name: "Ana", last_name: "Lopez", email: "ana@demo.com", role: "admin" },
            { first_name: "Bruno", last_name: "Perez", email: "bruno@demo.com", role: "professor" },
        ] as User[]

        expect(searchUser(users, "ana", "admin")).toHaveLength(1)
        expect(searchUser(users, "bruno", "student")).toHaveLength(0)
    })
})
