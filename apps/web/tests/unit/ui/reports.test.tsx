import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"
import type { ProfessorService, SubjectService } from "@/lib/@types/services"
import type { Report } from "@/lib/@types/reports"
import { Reports } from "@/ui/report/report"

const alertMock = vi.fn()
vi.stubGlobal("alert", alertMock)

vi.mock("lucide-react", async () => {
    const actual = await vi.importActual<typeof import("lucide-react")>("lucide-react")
    return actual
})

const {
    getProfessorsMock,
    getReportsMock,
    createReportMock,
    getSubjectsMock,
    getSubjectsByProfessorIdMock,
    generateNewReportPDFMock,
    generateSavedReportPDFMock,
} = vi.hoisted(() => ({
    getProfessorsMock: vi.fn(),
    getReportsMock: vi.fn(),
    createReportMock: vi.fn(),
    getSubjectsMock: vi.fn(),
    getSubjectsByProfessorIdMock: vi.fn(),
    generateNewReportPDFMock: vi.fn(),
    generateSavedReportPDFMock: vi.fn(),
}))

vi.mock("@/services/professors", () => ({
    getProfessors: getProfessorsMock,
}))

vi.mock("@/services/report", () => ({
    getReports: getReportsMock,
    createReport: createReportMock,
}))

vi.mock("@/services/subjects", () => ({
    getSubjects: getSubjectsMock,
    getSubjectsByProfessorId: getSubjectsByProfessorIdMock,
}))

vi.mock("@/lib/report", () => ({
    generateNewReportPDF: generateNewReportPDFMock,
    generateSavedReportPDF: generateSavedReportPDFMock,
}))

const buildProfessor = (id: string, firstName: string, lastName: string): ProfessorService => ({
    id,
    first_name: firstName,
    last_name: lastName,
    email: `${id}@example.com`,
    password: "secret",
    role: "professor",
    created_at: "2026-01-01T00:00:00.000Z",
    status: true,
    address: "Calle 1",
    phone: "3000000001",
})

const professorsDb: ProfessorService[] = [buildProfessor("prof-1", "Ana", "Lopez"), buildProfessor("prof-2", "Luis", "Perez")]

const allSubjectsDb: SubjectService[] = [
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
]

const subjectsByProfessorDb: Record<string, SubjectService[]> = {
    "prof-1": [allSubjectsDb[0]],
    "prof-2": [allSubjectsDb[1]],
}

const savedReportsDb: Report[] = [
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

const getSelectTriggerByLabel = (label: RegExp) => {
    const labelNode = screen.getByText(label, { selector: "label" })
    const fieldContainer = labelNode.closest("div")
    if (!fieldContainer) {
        throw new Error(`No se encontró contenedor para el label ${label}`)
    }
    return within(fieldContainer).getByRole("combobox")
}

const openSelectByLabel = async (label: RegExp, option: RegExp) => {
    const trigger = getSelectTriggerByLabel(label)
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

describe("Reports page", () => {
    beforeEach(() => {
        alertMock.mockReset()

        getProfessorsMock.mockResolvedValue(structuredClone(professorsDb))
        getReportsMock.mockResolvedValue(structuredClone(savedReportsDb))
        getSubjectsMock.mockResolvedValue(structuredClone(allSubjectsDb))
        getSubjectsByProfessorIdMock.mockImplementation(async (professorId: string) => subjectsByProfessorDb[professorId] ?? [])
        createReportMock.mockImplementation(async (payload: any) => ({
            id: `report-${Date.now()}`,
            title: payload.title,
            professor_id: payload.professor_id,
            subject_id: payload.subject_id,
            semester: payload.semester,
            comments: payload.comments,
            recommendations: payload.recommendations,
            created_at: "2026-02-28T12:00:00.000Z",
            professor_name: professorsDb.find((prof) => prof.id === payload.professor_id)
                ? `${professorsDb.find((prof) => prof.id === payload.professor_id)?.first_name} ${
                      professorsDb.find((prof) => prof.id === payload.professor_id)?.last_name
                  }`
                : null,
            subject_name: allSubjectsDb.find((subject) => subject.id === payload.subject_id)?.name ?? null,
        }))
        generateNewReportPDFMock.mockReset()
        generateSavedReportPDFMock.mockReset()
    })

    it("validates required fields before saving draft", async () => {
        render(<Reports />)
        await screen.findByRole("heading", { name: /informes de profesores/i })

        fireEvent.click(screen.getByRole("button", { name: /guardar borrador/i }))
        expect(alertMock).toHaveBeenCalledWith(expect.stringMatching(/t.tulo del informe/i))
        expect(createReportMock).not.toHaveBeenCalled()

        fireEvent.change(screen.getByLabelText(/t.tulo del informe/i), { target: { value: "Informe semestral" } })
        fireEvent.click(screen.getByRole("button", { name: /guardar borrador/i }))
        expect(alertMock).toHaveBeenCalledWith(expect.stringMatching(/profesor espec.fico/i))
        expect(createReportMock).not.toHaveBeenCalled()

        await openSelectByLabel(/profesor/i, /ana lopez/i)
        fireEvent.click(screen.getByRole("button", { name: /guardar borrador/i }))
        expect(alertMock).toHaveBeenCalledWith(expect.stringMatching(/materia espec.fica/i))
        expect(createReportMock).not.toHaveBeenCalled()
    })

    it("creates a draft report and moves to saved tab with rendered values", async () => {
        render(<Reports />)
        await screen.findByRole("heading", { name: /informes de profesores/i })

        fireEvent.change(screen.getByLabelText(/t.tulo del informe/i), { target: { value: "Informe Final Docente" } })
        await openSelectByLabel(/profesor/i, /ana lopez/i)
        await openSelectByLabel(/materia/i, /matematica basica/i)
        fireEvent.change(screen.getByLabelText(/an.lisis y comentarios/i), { target: { value: "Analisis de periodo." } })
        fireEvent.change(screen.getByLabelText(/recomendaciones/i), { target: { value: "Reforzar tutorias." } })

        fireEvent.click(screen.getByRole("button", { name: /guardar borrador/i }))

        await waitFor(() => {
            expect(createReportMock).toHaveBeenCalledTimes(1)
        })

        expect(createReportMock).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Informe Final Docente",
                professor_id: "prof-1",
                subject_id: "subject-1",
                semester: "2024-1",
                comments: "Analisis de periodo.",
                recommendations: "Reforzar tutorias.",
            })
        )

        expect(alertMock).toHaveBeenCalledWith(expect.stringMatching(/borrador guardado/i))
        expect(await screen.findByText(/informe final docente/i)).toBeInTheDocument()
        expect(screen.getAllByText(/docente:/i).length).toBeGreaterThan(0)
    })

    it("generates new and saved report PDFs with current ui data", async () => {
        render(<Reports />)
        await screen.findByRole("heading", { name: /informes de profesores/i })

        fireEvent.change(screen.getByLabelText(/t.tulo del informe/i), { target: { value: "Informe PDF" } })
        await openSelectByLabel(/profesor/i, /ana lopez/i)
        await openSelectByLabel(/materia/i, /matematica basica/i)

        fireEvent.click(screen.getByRole("button", { name: /generar pdf/i }))
        expect(generateNewReportPDFMock).toHaveBeenCalledTimes(1)
        expect(generateNewReportPDFMock).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Informe PDF",
                professor: "prof-1",
                subject: "subject-1",
            }),
            expect.any(Array),
            expect.any(Array)
        )

        await openTab(/informes guardados/i)
        fireEvent.click(await screen.findByTitle(/descargar pdf/i))
        expect(generateSavedReportPDFMock).toHaveBeenCalledWith(expect.any(Array), "report-1")
    })

    it("keeps latest professor selection when subjects resolve out of order", async () => {
        let resolveProf1Subjects: ((value: SubjectService[]) => void) | null = null
        let resolveProf2Subjects: ((value: SubjectService[]) => void) | null = null

        getSubjectsByProfessorIdMock.mockImplementation(
            (professorId: string) =>
                new Promise<SubjectService[]>((resolve) => {
                    if (professorId === "prof-1") {
                        resolveProf1Subjects = resolve
                        return
                    }
                    resolveProf2Subjects = resolve
                })
        )

        render(<Reports />)
        await screen.findByRole("heading", { name: /informes de profesores/i })

        await openSelectByLabel(/profesor/i, /ana lopez/i)
        await openSelectByLabel(/profesor/i, /luis perez/i)

        expect(resolveProf1Subjects).not.toBeNull()
        expect(resolveProf2Subjects).not.toBeNull()

        resolveProf2Subjects?.(subjectsByProfessorDb["prof-2"])
        await waitFor(() => {
            expect(getSelectTriggerByLabel(/materia/i)).toHaveTextContent(/selecciona una materia/i)
        })

        resolveProf1Subjects?.(subjectsByProfessorDb["prof-1"])
        await waitFor(() => {
            expect(getSelectTriggerByLabel(/materia/i)).toHaveTextContent(/selecciona una materia/i)
        })
    })
})

afterAll(() => {
    vi.unstubAllGlobals()
})
