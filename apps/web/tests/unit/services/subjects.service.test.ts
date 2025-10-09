import { describe, it, expect } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "../setup"
import { getSubjects, addSubject, deleteSubject, addAssignment, deleteAssignment } from "@/services/subjects"
import type { SubjectService, SubjectAssignmentService } from "@/lib/@types/services"

const API_BASE = "http://localhost:4000/api/v1"

const mockSubject: SubjectService = {
    id: "subject-1",
    name: "Matemáticas",
    description: "Matemáticas Básicas",
    professor_id: "prof-1",
}

const mockSubjects: SubjectService[] = [
    mockSubject,
    {
        id: "subject-2",
        name: "Física",
        description: "Física General",
        professor_id: "prof-2",
    },
]

const mockAssignment: SubjectAssignmentService = {
    id: "assignment-1",
    professor_id: "prof-1",
    subject_id: "subject-1",
    assigned_at: new Date().toISOString(),
}

describe("Subjects Service", () => {
    describe("getSubjects", () => {
        it("should fetch all subjects successfully", async () => {
            server.use(
                http.get(`${API_BASE}/subjects`, () => {
                    return HttpResponse.json({ data: mockSubjects })
                })
            )

            const result = await getSubjects()

            expect(result).toEqual(mockSubjects)
            expect(result).toHaveLength(2)
            expect(result[0].name).toBe("Matemáticas")
        })

        it("should return empty array when no subjects exist", async () => {
            server.use(
                http.get(`${API_BASE}/subjects`, () => {
                    return HttpResponse.json({ data: [] })
                })
            )

            const result = await getSubjects()

            expect(result).toEqual([])
            expect(result).toHaveLength(0)
        })

        it("should handle API errors", async () => {
            server.use(
                http.get(`${API_BASE}/subjects`, () => {
                    return new HttpResponse(null, { status: 500 })
                })
            )

            await expect(getSubjects()).rejects.toThrow()
        })
    })

    describe("addSubject", () => {
        it("should create a new subject successfully", async () => {
            const newSubject: Omit<SubjectService, "id"> = {
                name: "Química",
                description: "Química General",
                professor_id: "prof-3",
            }

            server.use(
                http.post(`${API_BASE}/subjects`, async ({ request }) => {
                    const body = (await request.json()) as any
                    return HttpResponse.json({
                        data: {
                            ...body,
                            id: "new-subject-id",
                        },
                    })
                })
            )

            const result = await addSubject(newSubject)

            expect(result).toBeDefined()
            expect(result.name).toBe(newSubject.name)
            expect(result.id).toBeDefined()
        })

        it("should validate required fields", async () => {
            server.use(
                http.post(`${API_BASE}/subjects`, () => {
                    return new HttpResponse(null, { status: 400 })
                })
            )

            const invalidSubject = {
                name: "",
                description: "",
                professor_id: "",
            }

            await expect(addSubject(invalidSubject)).rejects.toThrow()
        })

        it("should prevent duplicate subject codes", async () => {
            server.use(
                http.post(`${API_BASE}/subjects`, () => {
                    return new HttpResponse(null, { status: 409 })
                })
            )

            const duplicateSubject: Omit<SubjectService, "id"> = {
                name: "Matemáticas", // Ya existe
                description: "Test",
                professor_id: "prof-1",
            }

            await expect(addSubject(duplicateSubject)).rejects.toThrow()
        })
    })

    describe("deleteSubject", () => {
        it("should delete a subject successfully", async () => {
            server.use(
                http.delete(`${API_BASE}/subjects/${mockSubject.id}`, () => {
                    return HttpResponse.json({ data: true })
                })
            )

            const result = await deleteSubject(mockSubject.id)

            expect(result).toBe(true)
        })

        it("should handle deletion of non-existent subject", async () => {
            server.use(
                http.delete(`${API_BASE}/subjects/non-existent-id`, () => {
                    return new HttpResponse(null, { status: 404 })
                })
            )

            await expect(deleteSubject("non-existent-id")).rejects.toThrow()
        })

        it("should prevent deletion when subject has assignments", async () => {
            server.use(
                http.delete(`${API_BASE}/subjects/${mockSubject.id}`, () => {
                    return new HttpResponse(null, { status: 409 })
                })
            )

            await expect(deleteSubject(mockSubject.id)).rejects.toThrow()
        })
    })

    describe("addAssignment", () => {
        it("should create a new assignment successfully", async () => {
            const professorId = "prof-1"
            const subjectId = "subject-1"

            server.use(
                http.post(`${API_BASE}/subjects/assignments`, async ({ request }) => {
                    const body = (await request.json()) as any
                    return HttpResponse.json([
                        {
                            id: "new-assignment-id",
                            professor_id: body.professorId,
                            subject_id: body.subjectId,
                        },
                    ])
                })
            )

            const result = await addAssignment(professorId, subjectId)

            expect(result).toBeDefined()
            expect(Array.isArray(result)).toBe(true)
            expect(result[0]?.professor_id).toBe(professorId)
            expect(result[0]?.subject_id).toBe(subjectId)
        })

        it("should validate professor and subject exist", async () => {
            server.use(
                http.post(`${API_BASE}/subjects/assignments`, () => {
                    return new HttpResponse(null, { status: 404 })
                })
            )

            await expect(addAssignment("non-existent-prof", "non-existent-subject")).rejects.toThrow()
        })

        it("should prevent duplicate assignments", async () => {
            server.use(
                http.post(`${API_BASE}/subjects/assignments`, () => {
                    return new HttpResponse(null, { status: 409 })
                })
            )

            await expect(addAssignment("prof-1", "subject-1")).rejects.toThrow()
        })
    })

    describe("deleteAssignment", () => {
        it("should delete an assignment successfully", async () => {
            server.use(
                http.delete(`${API_BASE}/subjects/assignments/${mockAssignment.id}`, () => {
                    return HttpResponse.json(true)
                })
            )

            const result = await deleteAssignment(mockAssignment.id)

            expect(result).toBe(true)
        })

        it("should handle deletion of non-existent assignment", async () => {
            server.use(
                http.delete(`${API_BASE}/subjects/assignments/non-existent-id`, () => {
                    return new HttpResponse(null, { status: 404 })
                })
            )

            const result = await deleteAssignment("non-existent-id")

            expect(result).toBe(false)
        })

        it("should handle network errors gracefully", async () => {
            server.use(
                http.delete(`${API_BASE}/subjects/assignments/${mockAssignment.id}`, () => {
                    return new HttpResponse(null, { status: 500 })
                })
            )

            const result = await deleteAssignment(mockAssignment.id)

            expect(result).toBe(false)
        })
    })
})
