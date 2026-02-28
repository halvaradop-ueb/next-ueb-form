import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterAll, describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { Reports } from "@/ui/report/report"
import { server } from "../setup"

const API_BASE = "http://localhost:4000/api/v1"
const alertMock = vi.fn()
vi.stubGlobal("alert", alertMock)

vi.mock("@/lib/report", () => ({
    generateNewReportPDF: vi.fn(),
    generateSavedReportPDF: vi.fn(),
}))

type CreateReportPayload = {
    title: string
    professor_id: string
    subject_id: string
    semester: string | null
    comments: string
    recommendations: string
}

type TestContext = {
    usersRequests: number
    reportsGetRequests: number
    subjectsAllRequests: number
    subjectsByProfessorRequests: string[]
    createReportBodies: CreateReportPayload[]
}

const setupBackendAndRender = async (): Promise<TestContext> => {
    alertMock.mockReset()
    let usersRequests = 0
    let reportsGetRequests = 0
    let subjectsAllRequests = 0
    const subjectsByProfessorRequests: string[] = []
    const createReportBodies: CreateReportPayload[] = []
    let reportsDb = [
        {
            id: "report-1",
            title: "Informe Guardado Inicial",
            professor_id: "prof-1",
            subject_id: "subject-1",
            semester: "2025-2",
            comments: "Comentarios iniciales",
            recommendations: "Recomendaciones iniciales",
            created_at: "2026-02-01T10:00:00.000Z",
            professor_name: "Ana Lopez",
            subject_name: "Matematica Basica",
        },
    ]

    server.use(
        http.get(`${API_BASE}/users`, () => {
            usersRequests += 1
            return HttpResponse.json({
                data: [
                    {
                        id: "prof-1",
                        first_name: "Ana",
                        last_name: "Lopez",
                        email: "ana@example.com",
                        password: "secret",
                        role: "professor",
                        created_at: "2026-01-01T00:00:00.000Z",
                        status: true,
                        address: "Calle 1",
                        phone: "3000000001",
                    },
                    {
                        id: "prof-2",
                        first_name: "Luis",
                        last_name: "Perez",
                        email: "luis@example.com",
                        password: "secret",
                        role: "professor",
                        created_at: "2026-01-01T00:00:00.000Z",
                        status: true,
                        address: "Calle 2",
                        phone: "3000000002",
                    },
                    {
                        id: "student-1",
                        first_name: "Daniela",
                        last_name: "Ruiz",
                        email: "daniela@example.com",
                        password: "secret",
                        role: "student",
                        created_at: "2026-01-01T00:00:00.000Z",
                        status: true,
                        address: "Calle 3",
                        phone: "3000000003",
                    },
                ],
            })
        }),
        http.get(`${API_BASE}/reports`, () => {
            reportsGetRequests += 1
            return HttpResponse.json({ data: reportsDb })
        }),
        http.post(`${API_BASE}/reports`, async ({ request }) => {
            const body = (await request.json()) as CreateReportPayload
            createReportBodies.push(body)
            const created = {
                id: `report-${createReportBodies.length + 1}`,
                title: body.title,
                professor_id: body.professor_id,
                subject_id: body.subject_id,
                semester: body.semester,
                comments: body.comments,
                recommendations: body.recommendations,
                created_at: "2026-02-28T12:00:00.000Z",
                professor_name: body.professor_id === "prof-1" ? "Ana Lopez" : "Luis Perez",
                subject_name: body.subject_id === "subject-1" ? "Matematica Basica" : "Fisica Aplicada",
            }
            reportsDb = [created, ...reportsDb]
            return HttpResponse.json({ data: created }, { status: 201 })
        }),
        http.get(`${API_BASE}/subjects`, () => {
            subjectsAllRequests += 1
            return HttpResponse.json({
                data: [
                    {
                        id: "subject-1",
                        name: "Matematica Basica",
                        description: "Fundamentos",
                        semestre: "Semestre 1",
                        professor_id: "prof-1",
                    },
                    {
                        id: "subject-2",
                        name: "Fisica Aplicada",
                        description: "Laboratorio",
                        semestre: "Semestre 2",
                        professor_id: "prof-2",
                    },
                ],
            })
        }),
        http.get(`${API_BASE}/subjects/:professorId/professors`, ({ params }) => {
            const professorId = String(params.professorId)
            subjectsByProfessorRequests.push(professorId)

            if (professorId === "prof-1") {
                return HttpResponse.json({
                    data: [
                        {
                            id: "subject-1",
                            name: "Matematica Basica",
                            description: "Fundamentos",
                            semestre: "Semestre 1",
                            professor_id: "prof-1",
                        },
                    ],
                })
            }

            if (professorId === "prof-2") {
                return HttpResponse.json({
                    data: [
                        {
                            id: "subject-2",
                            name: "Fisica Aplicada",
                            description: "Laboratorio",
                            semestre: "Semestre 2",
                            professor_id: "prof-2",
                        },
                    ],
                })
            }

            return HttpResponse.json({ data: [] })
        })
    )

    render(<Reports />)
    await screen.findByRole("heading", { name: /informes de profesores/i })

    return {
        usersRequests,
        reportsGetRequests,
        subjectsAllRequests,
        subjectsByProfessorRequests,
        createReportBodies,
    }
}

const openSelectByLabel = async (label: RegExp, option: RegExp) => {
    const labelNode = screen.getByText(label, { selector: "label" })
    const fieldContainer = labelNode.closest("div")
    if (!fieldContainer) {
        throw new Error(`No se encontró contenedor para el label ${label}`)
    }
    const trigger = within(fieldContainer).getByRole("combobox")
    await waitFor(() => {
        expect(trigger).toBeEnabled()
    })
    trigger.focus()
    fireEvent.keyDown(trigger, { key: "ArrowDown", code: "ArrowDown" })
    const listbox = await screen.findByRole("listbox")
    fireEvent.click(within(listbox).getByRole("option", { name: option }))
}

const openTab = async (label: RegExp) => {
    const tab = screen.getByRole("tab", { name: label })
    fireEvent.mouseDown(tab)
    fireEvent.click(tab)
    await waitFor(() => {
        expect(tab).toHaveAttribute("aria-selected", "true")
    })
}

describe("Reports UI <> backend sync", () => {
    it("loads initial backend data and renders saved reports", async () => {
        const ctx = await setupBackendAndRender()

        await openTab(/informes guardados/i)

        expect(await screen.findByText(/informe guardado inicial/i)).toBeInTheDocument()
        expect(ctx.usersRequests).toBe(1)
        expect(ctx.reportsGetRequests).toBe(1)
        expect(ctx.subjectsAllRequests).toBeGreaterThanOrEqual(1)
    })

    it("syncs professor selection with filtered subjects and resets selected subject", async () => {
        const ctx = await setupBackendAndRender()

        await openSelectByLabel(/profesor/i, /ana lopez/i)
        await waitFor(() => {
            expect(ctx.subjectsByProfessorRequests).toContain("prof-1")
        })

        await openSelectByLabel(/materia/i, /matematica basica/i)
        expect(
            within(screen.getByText(/materia/i, { selector: "label" }).closest("div")!).getByRole("combobox")
        ).toHaveTextContent(/matematica basica/i)

        await openSelectByLabel(/profesor/i, /luis perez/i)
        await waitFor(() => {
            expect(ctx.subjectsByProfessorRequests).toContain("prof-2")
        })
        expect(
            within(screen.getByText(/materia/i, { selector: "label" }).closest("div")!).getByRole("combobox")
        ).toHaveTextContent(/selecciona una materia/i)
    })

    it("posts report payload from ui and renders new saved report", async () => {
        const ctx = await setupBackendAndRender()

        fireEvent.change(screen.getByLabelText(/t.tulo del informe/i), { target: { value: "Informe Backend Sync" } })
        await openSelectByLabel(/profesor/i, /ana lopez/i)
        await openSelectByLabel(/materia/i, /matematica basica/i)
        fireEvent.change(screen.getByLabelText(/an.lisis y comentarios/i), { target: { value: "Analisis backend." } })
        fireEvent.change(screen.getByLabelText(/recomendaciones/i), { target: { value: "Plan backend." } })

        fireEvent.click(screen.getByRole("button", { name: /guardar borrador/i }))

        await waitFor(() => {
            expect(ctx.createReportBodies).toHaveLength(1)
        })
        expect(ctx.createReportBodies[0]).toEqual(
            expect.objectContaining({
                title: "Informe Backend Sync",
                professor_id: "prof-1",
                subject_id: "subject-1",
                semester: "2024-1",
                comments: "Analisis backend.",
                recommendations: "Plan backend.",
            })
        )
        expect(alertMock).toHaveBeenCalledWith(expect.stringMatching(/borrador guardado/i))
        expect(await screen.findByText(/informe backend sync/i)).toBeInTheDocument()
    })

    it("blocks invalid save attempts and avoids backend post", async () => {
        const ctx = await setupBackendAndRender()

        fireEvent.click(screen.getByRole("button", { name: /guardar borrador/i }))

        expect(alertMock).toHaveBeenCalledWith(expect.stringMatching(/t.tulo del informe/i))
        expect(ctx.createReportBodies).toHaveLength(0)
    })
})

afterAll(() => {
    vi.unstubAllGlobals()
})
