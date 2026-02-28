import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import { FeedbackManagement } from "@/ui/feedback/feedback"
import { server } from "../setup"

const API_BASE = "http://localhost:4000/api/v1"

vi.mock("recharts", () => {
    const Container = ({ children }: { children?: any }) => <div>{children}</div>
    const Primitive = () => <div />
    return {
        ResponsiveContainer: Container,
        BarChart: Container,
        Bar: Primitive,
        XAxis: Primitive,
        YAxis: Primitive,
        Tooltip: Primitive,
        PieChart: Container,
        Pie: Container,
        Cell: Primitive,
        LineChart: Container,
        Line: Primitive,
        Legend: Primitive,
    }
})

vi.mock("@/ui/feedback/generateFeedbackPDF", () => ({
    generateFeedbackPDF: vi.fn(async () => {}),
}))

const getCurrentSemesterMeta = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const isSecondSemester = month >= 7
    const semesterNumber = isSecondSemester ? 2 : 1
    const start = new Date(year, isSecondSemester ? 6 : 0, 1)
    const dateInSemester = new Date(year, isSecondSemester ? 7 : 1, 15)
    return {
        semesterLabel: `${year} - ${semesterNumber}`,
        dateInSemesterIso: dateInSemester.toISOString(),
        semesterStartIso: start.toISOString(),
    }
}

type TestContext = {
    subjectsRequests: string[]
    feedbackRequests: Array<{ professorId: string; subjectId: string }>
    autoEvaluationRequests: Array<{ professorId: string; subjectId: string }>
    studentEvaluationRequests: Array<{ subjectId: string; professorId: string | null }>
    coevaluationRequests: Array<{ professorId: string | null; subjectId: string | null }>
}

const setupBackendAndRender = async (): Promise<TestContext> => {
    const { semesterLabel, dateInSemesterIso, semesterStartIso } = getCurrentSemesterMeta()
    const subjectsRequests: string[] = []
    const feedbackRequests: Array<{ professorId: string; subjectId: string }> = []
    const autoEvaluationRequests: Array<{ professorId: string; subjectId: string }> = []
    const studentEvaluationRequests: Array<{ subjectId: string; professorId: string | null }> = []
    const coevaluationRequests: Array<{ professorId: string | null; subjectId: string | null }> = []

    server.use(
        http.get(`${API_BASE}/users`, () => {
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
        http.get(`${API_BASE}/subjects/:professorId/professors`, ({ params }) => {
            const professorId = String(params.professorId)
            subjectsRequests.push(professorId)

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

            return HttpResponse.json({ data: [] })
        }),
        http.get(`${API_BASE}/feedback`, ({ request }) => {
            const url = new URL(request.url)
            const professorId = url.searchParams.get("professorId") ?? ""
            const subjectId = url.searchParams.get("subjectId") ?? ""
            feedbackRequests.push({ professorId, subjectId })

            if (professorId === "prof-1" && subjectId === "subject-1") {
                return HttpResponse.json({
                    data: [
                        {
                            id: "feedback-1",
                            feedback_text: "Excelente comunicacion en clase",
                            feedback_date: dateInSemesterIso,
                            rating: 5,
                            professor: {
                                first_name: "Ana",
                                last_name: "Lopez",
                            },
                            student: {
                                first_name: "Daniela",
                                last_name: "Ruiz",
                            },
                            subject: {
                                name: "Matematica Basica",
                            },
                        },
                        {
                            id: "feedback-2",
                            feedback_text: "Explica con claridad los temas",
                            feedback_date: dateInSemesterIso,
                            rating: 4,
                            professor: {
                                first_name: "Ana",
                                last_name: "Lopez",
                            },
                            student: {
                                first_name: "Carlos",
                                last_name: "Mendez",
                            },
                            subject: {
                                name: "Matematica Basica",
                            },
                        },
                    ],
                })
            }

            return HttpResponse.json({ data: [] })
        }),
        http.get(`${API_BASE}/auto-evaluation`, ({ request }) => {
            const url = new URL(request.url)
            const professorId = url.searchParams.get("professorId") ?? ""
            const subjectId = url.searchParams.get("subjectId") ?? ""
            autoEvaluationRequests.push({ professorId, subjectId })

            if (professorId === "prof-1" && subjectId === "subject-1") {
                return HttpResponse.json([
                    {
                        semester: semesterLabel,
                        answers: [
                            {
                                id: "auto-1",
                                answer_id: "answer-1",
                                answer_text: "Reflexion docente del semestre",
                                professor_id: "prof-1",
                                subject_id: "subject-1",
                                semester: semesterLabel,
                                question_title: "Autoevaluacion general",
                                question_id: "question-text-1",
                            },
                        ],
                    },
                ])
            }

            return HttpResponse.json([])
        }),
        http.get(`${API_BASE}/questions`, ({ request }) => {
            const url = new URL(request.url)
            const subjectId = url.searchParams.get("subject")

            if (subjectId === "subject-1") {
                return HttpResponse.json({
                    questions: [
                        {
                            id: "question-num-1",
                            title: "Dominio del tema",
                            description: "Evalua dominio",
                            question_type: "numeric",
                            required: true,
                            target_audience: "student",
                            stage_id: "stage-1",
                            stage: {
                                id: "stage-1",
                                name: "Etapa 1",
                            },
                            options: [],
                        },
                        {
                            id: "question-text-1",
                            title: "Comentario abierto",
                            description: "Texto libre",
                            question_type: "text",
                            required: false,
                            target_audience: "student",
                            stage_id: "stage-1",
                            stage: {
                                id: "stage-1",
                                name: "Etapa 1",
                            },
                            options: [],
                        },
                    ],
                })
            }

            return HttpResponse.json({ questions: [] })
        }),
        http.get(`${API_BASE}/answers/student-evaluations`, ({ request }) => {
            const url = new URL(request.url)
            const subjectId = url.searchParams.get("subjectId") ?? ""
            const professorId = url.searchParams.get("professorId")
            studentEvaluationRequests.push({ subjectId, professorId })

            if (subjectId === "subject-1") {
                return HttpResponse.json({
                    data: [
                        {
                            question_id: "question-num-1",
                            response: "5",
                            id_professor: "prof-1",
                            semester: semesterLabel,
                        },
                        {
                            question_id: "question-num-1",
                            response: "4",
                            id_professor: "prof-1",
                            semester: semesterLabel,
                        },
                        {
                            question_id: "question-text-1",
                            response: "Excelente seguimiento",
                            id_professor: "prof-1",
                            semester: semesterLabel,
                        },
                    ],
                })
            }

            return HttpResponse.json({ data: [] })
        }),
        http.get(`${API_BASE}/co_evaluations`, ({ request }) => {
            const url = new URL(request.url)
            const professorId = url.searchParams.get("professorId")
            const subjectId = url.searchParams.get("subjectId")
            coevaluationRequests.push({ professorId, subjectId })

            if (professorId === "prof-1" && subjectId === "subject-1") {
                return HttpResponse.json([
                    {
                        id: "coevaluation-1",
                        professor_id: "prof-1",
                        subject_id: "subject-1",
                        admin_id: "admin-1",
                        semestre: `${semesterStartIso} - 2026-06-30T23:59:59.999Z`,
                        findings: "Se identifican oportunidades de mejora en evaluaciones formativas.",
                        improvement_plan: "Implementar rubricas y retroalimentacion semanal.",
                        professor: {
                            first_name: "Ana",
                            last_name: "Lopez",
                        },
                        admin: {
                            first_name: "Admin",
                            last_name: "Principal",
                        },
                        subject: {
                            name: "Matematica Basica",
                        },
                    },
                ])
            }

            return HttpResponse.json([])
        })
    )

    render(<FeedbackManagement />)
    await screen.findByText(/revisi.n de retroalimentaci.n/i)

    return {
        subjectsRequests,
        feedbackRequests,
        autoEvaluationRequests,
        studentEvaluationRequests,
        coevaluationRequests,
    }
}

const openSelectByLabel = async (label: RegExp, option: RegExp) => {
    const trigger = screen.getByRole("combobox", { name: label })
    await waitFor(() => {
        expect(trigger).toBeEnabled()
    })
    trigger.focus()
    fireEvent.keyDown(trigger, { key: "ArrowDown", code: "ArrowDown" })
    const listbox = await screen.findByRole("listbox")
    fireEvent.click(within(listbox).getByRole("option", { name: option }))
}

const selectOldestAvailablePeriod = async () => {
    const trigger = screen.getByRole("combobox", { name: /periodo de tiempo/i })
    fireEvent.mouseDown(trigger)
    fireEvent.click(trigger)
    const listbox = await screen.findByRole("listbox")
    const options = within(listbox).getAllByRole("option")
    const periodOptions = options.filter((option) => !/todos los periodos/i.test(option.textContent ?? ""))
    const oldestPeriod = periodOptions[periodOptions.length - 1]
    expect(oldestPeriod).toBeDefined()
    fireEvent.click(oldestPeriod)
}

const openTab = async (label: RegExp) => {
    const tab = screen.getByRole("tab", { name: label })
    fireEvent.mouseDown(tab)
    fireEvent.click(tab)
    await waitFor(() => {
        expect(tab).toHaveAttribute("aria-selected", "true")
    })
}

describe("Feedback UI <> backend sync", () => {
    describe("seleccionar profesor y materia", () => {
        it("consulta backend y renderiza resumen, comentarios e indices", async () => {
            const ctx = await setupBackendAndRender()

            await openSelectByLabel(/profesor/i, /ana lopez/i)
            await openSelectByLabel(/materia/i, /matematica basica/i)

            await waitFor(() => {
                expect(screen.getByText(/calificaci.n general/i)).toBeInTheDocument()
                expect(screen.getAllByText("4.50").length).toBeGreaterThan(0)
                expect(screen.getByText(/total de evaluaciones/i)).toBeInTheDocument()
            })

            await openTab(/comentarios/i)
            await waitFor(() => {
                expect(screen.queryByText(/no hay comentarios disponibles/i)).not.toBeInTheDocument()
            })
            expect(
                await screen.findByText((text) => text.toLowerCase().includes("excelente comunicacion en clase"))
            ).toBeInTheDocument()

            await openTab(/indices/i)
            expect(await screen.findAllByText(/total respuestas/i)).not.toHaveLength(0)

            expect(ctx.subjectsRequests).toEqual(["prof-1"])
            expect(ctx.feedbackRequests[0]).toEqual({ professorId: "prof-1", subjectId: "subject-1" })
            expect(ctx.studentEvaluationRequests.some((req) => req.subjectId === "subject-1")).toBe(true)
        })
    })

    describe("seleccionar profesor sin materias", () => {
        it("muestra mensaje vacio y evita consultas de feedback", async () => {
            const ctx = await setupBackendAndRender()

            await openSelectByLabel(/profesor/i, /luis perez/i)

            await waitFor(() => {
                expect(screen.getByText(/no tiene materias asignadas/i)).toBeInTheDocument()
            })

            expect(ctx.subjectsRequests).toContain("prof-2")
            expect(ctx.feedbackRequests).toHaveLength(0)
        })
    })

    describe("cambiar periodo de tiempo", () => {
        it("filtra resultados sin volver a solicitar feedback", async () => {
            const ctx = await setupBackendAndRender()

            await openSelectByLabel(/profesor/i, /ana lopez/i)
            await openSelectByLabel(/materia/i, /matematica basica/i)

            await waitFor(() => {
                expect(screen.getByText(/calificaci.n general/i)).toBeInTheDocument()
            })

            const feedbackRequestsBefore = ctx.feedbackRequests.length

            await selectOldestAvailablePeriod()

            await waitFor(() => {
                expect(screen.getByText(/no hay comentarios disponibles/i)).toBeInTheDocument()
            })

            expect(ctx.feedbackRequests.length).toBe(feedbackRequestsBefore)
            expect(ctx.autoEvaluationRequests.length).toBeGreaterThanOrEqual(2)
            expect(ctx.coevaluationRequests.length).toBeGreaterThanOrEqual(2)
        })
    })

    describe("coevaluacion", () => {
        it("renderiza datos de coevaluacion sincronizados con backend", async () => {
            const ctx = await setupBackendAndRender()

            await openSelectByLabel(/profesor/i, /ana lopez/i)
            await openSelectByLabel(/materia/i, /matematica basica/i)

            await waitFor(() => {
                expect(screen.getByText(/calificaci.n general/i)).toBeInTheDocument()
            })

            await openTab(/coevaluaci.n/i)

            await waitFor(() => {
                expect(screen.getByText(/implementar rubricas y retroalimentacion semanal/i)).toBeInTheDocument()
            })

            expect(ctx.coevaluationRequests.some((req) => req.professorId === "prof-1" && req.subjectId === "subject-1")).toBe(
                true
            )
        })
    })
})
