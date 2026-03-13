import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ProfessorService, SubjectAssignmentWithProfessorService, SubjectService } from "@/lib/@types/services"
import { Subjects } from "@/ui/subjects/subjects"

const {
    getSubjectsMock,
    addSubjectMock,
    updateSubjectMock,
    deleteSubjectMock,
    addAssignmentMock,
    deleteAssignmentMock,
    getProfessorsBySubjectMock,
    getProfessorsMock,
} = vi.hoisted(() => ({
    getSubjectsMock: vi.fn(),
    addSubjectMock: vi.fn(),
    updateSubjectMock: vi.fn(),
    deleteSubjectMock: vi.fn(),
    addAssignmentMock: vi.fn(),
    deleteAssignmentMock: vi.fn(),
    getProfessorsBySubjectMock: vi.fn(),
    getProfessorsMock: vi.fn(),
}))

vi.mock("@/services/subjects", () => ({
    getSubjects: getSubjectsMock,
    addSubject: addSubjectMock,
    updateSubject: updateSubjectMock,
    deleteSubject: deleteSubjectMock,
    addAssignment: addAssignmentMock,
    deleteAssignment: deleteAssignmentMock,
    getProfessorsBySubject: getProfessorsBySubjectMock,
}))

vi.mock("@/services/professors", () => ({
    getProfessors: getProfessorsMock,
}))

const initialSubjects: SubjectService[] = [
    {
        id: "subject-old-1",
        name: "Matematica Basica",
        description: "Fundamentos de algebra",
        semestre: "Semestre 1",
        professor_id: "",
    },
    {
        id: "subject-old-2",
        name: "Fisica General",
        description: "Mecanica y energia",
        semestre: "Semestre 2",
        professor_id: "",
    },
    {
        id: "subject-old-3",
        name: "Programacion I",
        description: "Logica y estructuras",
        semestre: "Semestre 3",
        professor_id: "",
    },
]

const initialProfessors: ProfessorService[] = [
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
]

const initialAssignments: SubjectAssignmentWithProfessorService[] = [
    {
        id: "assignment-old-1",
        subject_id: "subject-old-1",
        subject: {
            id: "subject-old-1",
            name: "Matematica Basica",
            description: "Fundamentos de algebra",
            semestre: "Semestre 1",
        },
        user: {
            id: "prof-1",
            first_name: "Ana",
            last_name: "Lopez",
            email: "ana@example.com",
        },
    },
]

const openCreateSubjectDialog = () => {
    fireEvent.click(screen.getByRole("button", { name: /nueva materia/i }))
}

const getCreateSubjectDialog = () => screen.getByRole("dialog", { name: /crear nueva materia/i })

const setSubjectName = (name: string) => {
    fireEvent.change(within(getCreateSubjectDialog()).getByLabelText(/nombre/i), { target: { value: name } })
}

const setSubjectDescription = (description: string) => {
    fireEvent.change(within(getCreateSubjectDialog()).getByLabelText(/descripci/i), {
        target: { value: description },
    })
}

const setSubjectSemester = async (semester: string) => {
    fireEvent.click(within(getCreateSubjectDialog()).getByRole("combobox", { name: /semestre/i }))
    const listbox = await screen.findByRole("listbox")
    fireEvent.click(within(listbox).getByRole("option", { name: new RegExp(semester, "i") }))
}

const saveSubject = () => {
    fireEvent.click(within(getCreateSubjectDialog()).getByRole("button", { name: /crear materia/i }))
}

const openEditSemesterDialog = (subjectName: string) => {
    const row = screen.getByRole("row", { name: new RegExp(subjectName, "i") })
    fireEvent.click(within(row).getByRole("button", { name: /editar semestre/i }))
}

const getEditSemesterDialog = () => screen.getByRole("dialog", { name: /editar semestre/i })

const setEditSemesterValue = async (semester: string) => {
    fireEvent.click(within(getEditSemesterDialog()).getByRole("combobox", { name: /semestre/i }))
    const listbox = await screen.findByRole("listbox")
    fireEvent.click(within(listbox).getByRole("option", { name: new RegExp(semester, "i") }))
}

const saveSemester = () => {
    fireEvent.click(within(getEditSemesterDialog()).getByRole("button", { name: /guardar/i }))
}

const openAssignmentDialogFromRow = (subjectName: string) => {
    const row = screen.getByRole("row", { name: new RegExp(subjectName, "i") })
    fireEvent.click(within(row).getByRole("button", { name: /asignar profesor/i }))
}

const getAssignmentDialog = () => screen.getByRole("dialog", { name: /asignar profesor a materia/i })

const setAssignmentProfessor = async (fullName: string) => {
    fireEvent.click(within(getAssignmentDialog()).getByRole("combobox", { name: /profesor/i }))
    fireEvent.click(await screen.findByText(new RegExp(fullName, "i")))
}

const saveAssignment = () => {
    fireEvent.click(within(getAssignmentDialog()).getByRole("button", { name: /asignar profesor/i }))
}

const openDeleteSubjectDialog = (subjectName: string) => {
    const row = screen.getByRole("row", { name: new RegExp(subjectName, "i") })
    fireEvent.click(within(row).getByRole("button", { name: /^eliminar$/i }))
}

const toggleSubjectExpansion = (subjectName: string) => {
    const row = screen.getByRole("row", { name: new RegExp(subjectName, "i") })
    fireEvent.click(within(row).getAllByRole("button")[0])
}

const openDeleteAssignmentDialog = (professorFullName: string) => {
    const assignmentText = screen.getByText(new RegExp(professorFullName, "i"))
    const assignmentRow = assignmentText.parentElement?.parentElement
    if (!assignmentRow) {
        throw new Error(`No assignment row found for ${professorFullName}`)
    }
    fireEvent.click(within(assignmentRow).getByRole("button", { name: /eliminar asignaci/i }))
}

const confirmDeleteDialog = (title: "Materia" | "asignaci") => {
    const dialog = screen.getByRole("dialog")
    fireEvent.change(within(dialog).getByPlaceholderText(/eliminar/i), { target: { value: "eliminar" } })
    fireEvent.click(within(dialog).getByRole("button", { name: new RegExp(`eliminar ${title}`, "i") }))
}

describe("Subjects page", () => {
    let subjectsDb: SubjectService[]
    let assignmentsDb: SubjectAssignmentWithProfessorService[]

    beforeEach(() => {
        subjectsDb = structuredClone(initialSubjects)
        assignmentsDb = structuredClone(initialAssignments)

        getSubjectsMock.mockImplementation(async () => subjectsDb)
        getProfessorsMock.mockImplementation(async () => structuredClone(initialProfessors))
        getProfessorsBySubjectMock.mockImplementation(async (subjectId: string) =>
            assignmentsDb.filter((assignment) => assignment.subject_id === subjectId)
        )
        addSubjectMock.mockImplementation(
            async (subject: Pick<SubjectService, "name" | "description" | "semestre">): Promise<SubjectService> => {
                const createdSubject: SubjectService = {
                    id: `subject-new-${subjectsDb.length + 1}`,
                    name: subject.name,
                    description: subject.description,
                    semestre: subject.semestre,
                    professor_id: "",
                }
                subjectsDb = [...subjectsDb, createdSubject]
                return createdSubject
            }
        )
        updateSubjectMock.mockImplementation(async (subjectId: string, updates: Partial<SubjectService>) => {
            subjectsDb = subjectsDb.map((subject) =>
                subject.id === subjectId
                    ? {
                          ...subject,
                          ...updates,
                      }
                    : subject
            )
            return subjectsDb.find((subject) => subject.id === subjectId) ?? null
        })
        deleteSubjectMock.mockImplementation(async (subjectId: string) => {
            subjectsDb = subjectsDb.filter((subject) => subject.id !== subjectId)
            assignmentsDb = assignmentsDb.filter((assignment) => assignment.subject_id !== subjectId)
            return true
        })
        addAssignmentMock.mockImplementation(async (professorId: string, subjectId: string) => {
            const professor = initialProfessors.find((prof) => prof.id === professorId)
            const subject = subjectsDb.find((item) => item.id === subjectId)

            if (!professor || !subject) {
                return []
            }

            const createdAssignment: SubjectAssignmentWithProfessorService = {
                id: `assignment-new-${assignmentsDb.length + 1}`,
                subject_id: subjectId,
                subject: {
                    id: subject.id,
                    name: subject.name,
                    description: subject.description,
                    semestre: subject.semestre,
                },
                user: {
                    id: professor.id,
                    first_name: professor.first_name,
                    last_name: professor.last_name,
                    email: professor.email,
                },
            }

            assignmentsDb = [...assignmentsDb, createdAssignment]
            return [
                {
                    id: createdAssignment.id,
                    professor_id: professor.id,
                    subject_id: subject.id,
                    assigned_at: "2026-02-25T00:00:00.000Z",
                },
            ]
        })
        deleteAssignmentMock.mockImplementation(async (assignmentId: string) => {
            assignmentsDb = assignmentsDb.filter((assignment) => assignment.id !== assignmentId)
            return true
        })
    })

    it("renders retrieved subjects with assignment data and search filtering", async () => {
        render(<Subjects />)

        expect(await screen.findByRole("row", { name: /matematica basica/i })).toBeInTheDocument()
        expect(screen.getByRole("row", { name: /fisica general/i })).toBeInTheDocument()
        expect(screen.getByRole("row", { name: /programacion i/i })).toBeInTheDocument()

        toggleSubjectExpansion("Matematica Basica")
        expect(await screen.findByText(/ana lopez/i)).toBeInTheDocument()

        fireEvent.change(screen.getByPlaceholderText(/buscar materias/i), { target: { value: "fisica" } })
        expect(screen.queryByRole("row", { name: /matematica basica/i })).not.toBeInTheDocument()
        expect(screen.getByRole("row", { name: /fisica general/i })).toBeInTheDocument()
    })

    it("handles full lifecycle: add multiple, edit old/new, add assignment, remove one and remove all", async () => {
        render(<Subjects />)
        await screen.findByRole("row", { name: /matematica basica/i })

        openCreateSubjectDialog()
        setSubjectName("Calculo Vectorial")
        setSubjectDescription("Vectores y planos")
        await setSubjectSemester("Semestre 2")
        saveSubject()

        await waitFor(() => {
            expect(screen.getByRole("row", { name: /calculo vectorial/i })).toBeInTheDocument()
        })

        openCreateSubjectDialog()
        setSubjectName("Arquitectura de Software")
        setSubjectDescription("Patrones y calidad")
        await setSubjectSemester("Semestre 3")
        saveSubject()

        await waitFor(() => {
            expect(screen.getByRole("row", { name: /arquitectura de software/i })).toBeInTheDocument()
        })

        openEditSemesterDialog("Matematica Basica")
        await setEditSemesterValue("Semestre 3")
        saveSemester()

        await waitFor(() => {
            expect(screen.getByRole("row", { name: /matematica basica/i })).toHaveTextContent(/semestre 3/i)
        })

        openEditSemesterDialog("Calculo Vectorial")
        await setEditSemesterValue("Semestre 1")
        saveSemester()

        await waitFor(() => {
            expect(screen.getByRole("row", { name: /calculo vectorial/i })).toHaveTextContent(/semestre 1/i)
        })

        openAssignmentDialogFromRow("Calculo Vectorial")
        await setAssignmentProfessor("Luis Perez")
        saveAssignment()

        await waitFor(() => {
            expect(screen.getByText(/luis perez/i)).toBeInTheDocument()
        })

        openDeleteSubjectDialog("Fisica General")
        confirmDeleteDialog("Materia")

        await waitFor(() => {
            expect(screen.queryByRole("row", { name: /fisica general/i })).not.toBeInTheDocument()
        })

        openDeleteAssignmentDialog("Luis Perez")
        confirmDeleteDialog("asignaci")

        await waitFor(() => {
            expect(screen.queryByText(/luis perez/i)).not.toBeInTheDocument()
        })

        openDeleteSubjectDialog("Matematica Basica")
        confirmDeleteDialog("Materia")
        await waitFor(() => {
            expect(screen.queryByRole("row", { name: /matematica basica/i })).not.toBeInTheDocument()
        })

        openDeleteSubjectDialog("Programacion I")
        confirmDeleteDialog("Materia")
        await waitFor(() => {
            expect(screen.queryByRole("row", { name: /programacion i/i })).not.toBeInTheDocument()
        })

        openDeleteSubjectDialog("Calculo Vectorial")
        confirmDeleteDialog("Materia")
        await waitFor(() => {
            expect(screen.queryByRole("row", { name: /calculo vectorial/i })).not.toBeInTheDocument()
        })

        openDeleteSubjectDialog("Arquitectura de Software")
        confirmDeleteDialog("Materia")
        await waitFor(() => {
            expect(screen.getByText(/no se encontraron materias/i)).toBeInTheDocument()
        })

        expect(getSubjectsMock).toHaveBeenCalledTimes(2)
        expect(addSubjectMock).toHaveBeenCalledTimes(2)
        expect(updateSubjectMock).toHaveBeenCalledTimes(2)
        expect(addAssignmentMock).toHaveBeenCalledTimes(1)
        expect(deleteAssignmentMock).toHaveBeenCalledTimes(1)
        expect(deleteSubjectMock).toHaveBeenCalledTimes(5)
    })
})
