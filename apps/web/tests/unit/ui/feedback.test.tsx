import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Feedback, ProfessorService, Question, SubjectService } from "@/lib/@types/services"
import { FeedbackManagement } from "@/ui/feedback/feedback"

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

const {
    getProfessorsMock,
    getAllCoevaluationsMock,
    getSubjectsByProfessorIdMock,
    getFeedbackMock,
    getAutoEvaluationAnswersMock,
    getQuestionsBySubjectMock,
    getStudentEvaluationsBySubjectMock,
} = vi.hoisted(() => ({
    getProfessorsMock: vi.fn(),
    getAllCoevaluationsMock: vi.fn(),
    getSubjectsByProfessorIdMock: vi.fn(),
    getFeedbackMock: vi.fn(),
    getAutoEvaluationAnswersMock: vi.fn(),
    getQuestionsBySubjectMock: vi.fn(),
    getStudentEvaluationsBySubjectMock: vi.fn(),
}))

vi.mock("@/services/professors", () => ({
    getProfessors: getProfessorsMock,
    getAllCoevaluations: getAllCoevaluationsMock,
}))

vi.mock("@/services/subjects", () => ({
    getSubjectsByProfessorId: getSubjectsByProfessorIdMock,
}))

vi.mock("@/services/feedback", () => ({
    getFeedback: getFeedbackMock,
}))

vi.mock("@/services/auto-evaluation", () => ({
    getAutoEvaluationAnswers: getAutoEvaluationAnswersMock,
}))

vi.mock("@/services/questions", () => ({
    getQuestionsBySubject: getQuestionsBySubjectMock,
}))

vi.mock("@/services/answer", () => ({
    getStudentEvaluationsBySubject: getStudentEvaluationsBySubjectMock,
}))

const getCurrentSemesterMeta = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const isSecondSemester = month >= 7
    const semesterNumber = isSecondSemester ? 2 : 1
    const start = new Date(year, isSecondSemester ? 6 : 0, 1)
    return {
        semesterLabel: `${year} - ${semesterNumber}`,
        dateInSemester: new Date(year, isSecondSemester ? 7 : 1, 15).toISOString(),
        rangeStartIso: start.toISOString(),
    }
}

const defaultProfessor: ProfessorService = {
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
}

const secondProfessor: ProfessorService = {
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
}

const subjectsByProfessor: Record<string, SubjectService[]> = {
    "prof-1": [
        {
            id: "subject-1",
            name: "Matematica Basica",
            description: "Fundamentos",
            semestre: "Semestre 1",
            professor_id: "prof-1",
        },
    ],
    "prof-2": [],
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

const openTab = async (label: RegExp) => {
    const tab = screen.getByRole("tab", { name: label })
    fireEvent.mouseDown(tab)
    fireEvent.click(tab)
    await waitFor(() => {
        expect(tab).toHaveAttribute("aria-selected", "true")
    })
}

describe("Feedback page", () => {
    beforeEach(() => {
        const { semesterLabel, dateInSemester, rangeStartIso } = getCurrentSemesterMeta()

        const feedbackDb: Feedback[] = [
            {
                id: "feedback-1",
                feedback_text: "Excelente comunicacion en clase",
                feedback_date: dateInSemester,
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
                feedback_date: dateInSemester,
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
        ]

        const questionDb: Question[] = [
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
        ]

        getProfessorsMock.mockResolvedValue([defaultProfessor, secondProfessor])
        getSubjectsByProfessorIdMock.mockImplementation(async (professorId: string) => subjectsByProfessor[professorId] ?? [])
        getFeedbackMock.mockImplementation(async (professorId: string, subjectId: string) =>
            professorId === "prof-1" && subjectId === "subject-1" ? feedbackDb : []
        )
        getQuestionsBySubjectMock.mockImplementation(async (subjectId: string) => (subjectId === "subject-1" ? questionDb : []))
        getStudentEvaluationsBySubjectMock.mockImplementation(async (subjectId: string) =>
            subjectId === "subject-1"
                ? [
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
                  ]
                : []
        )
        getAutoEvaluationAnswersMock.mockImplementation(async (professorId: string, subjectId: string) =>
            professorId === "prof-1" && subjectId === "subject-1"
                ? [
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
                  ]
                : []
        )
        getAllCoevaluationsMock.mockImplementation(async (professorId?: string, subjectId?: string) =>
            professorId === "prof-1" && subjectId === "subject-1"
                ? [
                      {
                          id: "coevaluation-1",
                          professor_id: "prof-1",
                          subject_id: "subject-1",
                          admin_id: "admin-1",
                          semestre: `${rangeStartIso} - 2026-06-30T23:59:59.999Z`,
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
                  ]
                : []
        )
    })

    it("shows default state and validates professor without subjects", async () => {
        render(<FeedbackManagement />)

        expect(await screen.findByText(/revisi.n de retroalimentaci.n/i)).toBeInTheDocument()
        expect(screen.getByText(/selecciona un profesor y una materia/i)).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /generar pdf/i })).toBeDisabled()

        await openSelectByLabel(/profesor/i, /luis perez/i)

        await waitFor(() => {
            expect(screen.getByText(/no tiene materias asignadas/i)).toBeInTheDocument()
        })
    })

    it("syncs selection flow and renders summary, comments, indexes, autoevaluation and coevaluation", async () => {
        render(<FeedbackManagement />)
        await screen.findByText(/revisi.n de retroalimentaci.n/i)

        await openSelectByLabel(/profesor/i, /ana lopez/i)
        await openSelectByLabel(/materia/i, /matematica basica/i)

        await waitFor(() => {
            expect(screen.getByText(/calificaci.n general/i)).toBeInTheDocument()
            expect(screen.getAllByText("4.50").length).toBeGreaterThan(0)
            expect(screen.getByText(/total de evaluaciones/i)).toBeInTheDocument()
            expect(screen.getByRole("button", { name: /generar pdf/i })).toBeEnabled()
        })

        await openTab(/comentarios/i)
        await waitFor(() => {
            expect(screen.queryByText(/no hay comentarios disponibles/i)).not.toBeInTheDocument()
        })
        expect(await screen.findByText((text) => text.toLowerCase().includes("excelente comunicacion en clase"))).toBeInTheDocument()

        await openTab(/indices/i)
        expect(await screen.findAllByText(/total respuestas/i)).not.toHaveLength(0)

        await openTab(/autoevaluaci.n/i)
        expect(await screen.findByText(/reflexion docente del semestre/i)).toBeInTheDocument()

        await openTab(/coevaluaci.n/i)
        expect(await screen.findByText(/plan de mejoramiento/i)).toBeInTheDocument()
        expect(screen.getByText(/implementar rubricas y retroalimentacion semanal/i)).toBeInTheDocument()

        expect(getProfessorsMock).toHaveBeenCalledTimes(1)
        expect(getSubjectsByProfessorIdMock).toHaveBeenCalledWith("prof-1")
        expect(getFeedbackMock).toHaveBeenCalledWith("prof-1", "subject-1")
        expect(getQuestionsBySubjectMock).toHaveBeenCalledWith("subject-1")
    })
})
