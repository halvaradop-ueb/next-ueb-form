import { describe, it, expect } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "../setup"
import { getStages, addStage, updateStage, deleteStage } from "@/services/stages"
import type { StageService } from "@/lib/@types/services"

const API_BASE = "http://localhost:4000/api/v1"

const mockStage: StageService = {
    id: "stage-1",
    name: "Evaluación Docente",
    description: "Evaluación del desempeño docente",
    target_audience: "student",
    questions: [],
}

const mockStages: StageService[] = [
    mockStage,
    {
        id: "stage-2",
        name: "Autoevaluación",
        description: "Autoevaluación del docente",
        target_audience: "professor",
        questions: [],
    },
    {
        id: "stage-3",
        name: "Coevaluación",
        description: "Evaluación entre pares",
        target_audience: "professor",
        questions: [],
    },
]

describe("Stages Service", () => {
    describe("getStages", () => {
        it("should fetch all stages successfully", async () => {
            server.use(
                http.get(`${API_BASE}/stages`, () => {
                    return HttpResponse.json({ data: mockStages })
                })
            )

            const result = await getStages()

            expect(result).toEqual(mockStages)
            expect(result).toHaveLength(3)
            expect(result[0].name).toBe("Evaluación Docente")
        })

        it("should return empty array when no stages exist", async () => {
            server.use(
                http.get(`${API_BASE}/stages`, () => {
                    return HttpResponse.json({ data: [] })
                })
            )

            const result = await getStages()

            expect(result).toEqual([])
            expect(result).toHaveLength(0)
        })

        it("should handle API errors", async () => {
            server.use(
                http.get(`${API_BASE}/stages`, () => {
                    return new HttpResponse(null, { status: 500 })
                })
            )

            await expect(getStages()).rejects.toThrow()
        })
    })

    describe("addStage", () => {
        it("should create a new stage successfully", async () => {
            const newStage: StageService = {
                id: "",
                name: "Nueva Etapa",
                description: "Descripción de nueva etapa",
                target_audience: "student",
                questions: [],
            }

            server.use(
                http.post(`${API_BASE}/stages`, async ({ request }) => {
                    const body = (await request.json()) as any
                    return HttpResponse.json({
                        data: {
                            ...body,
                            id: "new-stage-id",
                        },
                    })
                })
            )

            const result = await addStage(newStage)

            expect(result).toBeDefined()
            expect(result?.name).toBe(newStage.name)
            expect(result?.description).toBe(newStage.description)
            expect(result?.target_audience).toBe(newStage.target_audience)
            expect(result?.id).toBeDefined()
        })

        it("should validate required fields", async () => {
            server.use(
                http.post(`${API_BASE}/stages`, () => {
                    return new HttpResponse(null, { status: 400 })
                })
            )

            const invalidStage: StageService = {
                id: "",
                name: "",
                description: "",
                target_audience: "student",
                questions: [],
            }

            await expect(addStage(invalidStage)).rejects.toThrow()
        })

        it("should prevent duplicate stage names", async () => {
            server.use(
                http.post(`${API_BASE}/stages`, () => {
                    return new HttpResponse(null, { status: 409 })
                })
            )

            const duplicateStage: StageService = {
                id: "",
                name: "Evaluación Docente", // Ya existe
                description: "Test",
                target_audience: "student",
                questions: [],
            }

            await expect(addStage(duplicateStage)).rejects.toThrow()
        })
    })

    describe("updateStage", () => {
        it("should update an existing stage successfully", async () => {
            const updatedStage: StageService = {
                ...mockStage,
                name: "Evaluación Docente Actualizada",
                description: "Descripción actualizada",
            }

            server.use(
                http.put(`${API_BASE}/stages/${mockStage.id}`, async ({ request }) => {
                    const body = (await request.json()) as any
                    return HttpResponse.json({
                        data: {
                            ...body,
                            id: mockStage.id,
                        },
                    })
                })
            )

            const result = await updateStage(updatedStage)

            expect(result).toBeDefined()
            expect(result?.name).toBe("Evaluación Docente Actualizada")
            expect(result?.description).toBe("Descripción actualizada")
            expect(result?.id).toBe(mockStage.id)
        })

        it("should handle non-existent stage", async () => {
            server.use(
                http.put(`${API_BASE}/stages/non-existent-id`, () => {
                    return new HttpResponse(null, { status: 404 })
                })
            )

            const nonExistentStage: StageService = {
                id: "non-existent-id",
                name: "Test",
                description: "Test",
                target_audience: "student",
                questions: [],
            }

            await expect(updateStage(nonExistentStage)).rejects.toThrow()
        })

        it("should validate updated fields", async () => {
            server.use(
                http.put(`${API_BASE}/stages/${mockStage.id}`, () => {
                    return new HttpResponse(null, { status: 400 })
                })
            )

            const invalidUpdate: StageService = {
                ...mockStage,
                name: "",
            }

            await expect(updateStage(invalidUpdate)).rejects.toThrow()
        })
    })

    describe("deleteStage", () => {
        it("should delete a stage successfully", async () => {
            server.use(
                http.delete(`${API_BASE}/stages/${mockStage.id}`, () => {
                    return HttpResponse.json({ success: true })
                })
            )

            const result = await deleteStage(mockStage.id)

            expect(result).toBeTruthy()
        })

        it("should handle deletion of non-existent stage", async () => {
            server.use(
                http.delete(`${API_BASE}/stages/non-existent-id`, () => {
                    return new HttpResponse(null, { status: 404 })
                })
            )

            await expect(deleteStage("non-existent-id")).rejects.toThrow()
        })

        it("should prevent deletion when stage is in use", async () => {
            server.use(
                http.delete(`${API_BASE}/stages/${mockStage.id}`, () => {
                    return new HttpResponse(null, { status: 409 })
                })
            )

            await expect(deleteStage(mockStage.id)).rejects.toThrow()
        })
    })
})
