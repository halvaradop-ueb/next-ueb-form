import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "../setup"
import { createReport, getReports } from "@/services/report"

const API_BASE = "http://localhost:4000/api/v1"

describe("Report Service", () => {
    describe("getReports", () => {
        it("returns reports from wrapped data response", async () => {
            server.use(
                http.get(`${API_BASE}/reports`, () => {
                    return HttpResponse.json({
                        data: [
                            {
                                id: "report-1",
                                title: "Reporte 1",
                                professor_id: "prof-1",
                                subject_id: "subject-1",
                                created_at: "2026-02-01T00:00:00.000Z",
                            },
                        ],
                    })
                })
            )

            const result = await getReports()
            expect(result).toHaveLength(1)
            expect(result[0].title).toBe("Reporte 1")
        })

        it("returns reports from plain array response", async () => {
            server.use(
                http.get(`${API_BASE}/reports`, () => {
                    return HttpResponse.json([
                        {
                            id: "report-2",
                            title: "Reporte 2",
                            professor_id: "prof-1",
                            subject_id: "subject-2",
                            created_at: "2026-02-02T00:00:00.000Z",
                        },
                    ])
                })
            )

            const result = await getReports()
            expect(result).toHaveLength(1)
            expect(result[0].id).toBe("report-2")
        })

        it("returns empty array on backend error", async () => {
            server.use(
                http.get(`${API_BASE}/reports`, () => {
                    return new HttpResponse(null, { status: 500 })
                })
            )

            const result = await getReports()
            expect(result).toEqual([])
        })
    })

    describe("createReport", () => {
        it("returns created report from wrapped response", async () => {
            server.use(
                http.post(`${API_BASE}/reports`, async ({ request }) => {
                    const body = (await request.json()) as any
                    return HttpResponse.json({
                        data: {
                            id: "report-10",
                            ...body,
                            created_at: "2026-02-10T00:00:00.000Z",
                        },
                    })
                })
            )

            const result = await createReport({
                title: "Nuevo reporte",
                professor_id: "prof-1",
                subject_id: "subject-1",
                semester: "2026-1",
                comments: "Comentario",
                recommendations: "Recomendacion",
            })

            expect(result?.id).toBe("report-10")
            expect(result?.title).toBe("Nuevo reporte")
        })

        it("returns created report from plain object response", async () => {
            server.use(
                http.post(`${API_BASE}/reports`, async ({ request }) => {
                    const body = (await request.json()) as any
                    return HttpResponse.json({
                        id: "report-11",
                        ...body,
                        created_at: "2026-02-11T00:00:00.000Z",
                    })
                })
            )

            const result = await createReport({
                title: "Reporte plano",
                professor_id: "prof-2",
                subject_id: "subject-2",
                semester: "2026-1",
                comments: "Comentario",
                recommendations: "Recomendacion",
            })

            expect(result?.id).toBe("report-11")
            expect(result?.professor_id).toBe("prof-2")
        })

        it("returns null when backend fails", async () => {
            server.use(
                http.post(`${API_BASE}/reports`, () => {
                    return new HttpResponse(null, { status: 500 })
                })
            )

            const result = await createReport({
                title: "Reporte fallido",
                professor_id: "prof-1",
                subject_id: "subject-1",
                semester: "2026-1",
                comments: "Comentario",
                recommendations: "Recomendacion",
            })

            expect(result).toBeNull()
        })
    })
})
