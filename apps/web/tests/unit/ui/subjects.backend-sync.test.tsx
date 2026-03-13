import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { http, HttpResponse } from "msw"
import type { SubjectAssignmentWithProfessorService, SubjectService } from "@/lib/@types/services"
import { Subjects } from "@/ui/subjects/subjects"
import { server } from "../setup"

const API_BASE = "http://localhost:4000/api/v1"

const { getProfessorsBySubjectMock } = vi.hoisted(() => ({
    getProfessorsBySubjectMock: vi.fn(),
}))

vi.mock("@/services/subjects", async () => {
    const actual = await vi.importActual<typeof import("@/services/subjects")>("@/services/subjects")
    return {
        ...actual,
        getProfessorsBySubject: getProfessorsBySubjectMock,
    }
})

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
]

const usersDb = [
    {
        id: "prof-1",
        first_name: "Ana",
        last_name: "Lopez",
        email: "ana@example.com",
        role: "professor",
    },
    {
        id: "prof-2",
        first_name: "Luis",
        last_name: "Perez",
        email: "luis@example.com",
        role: "professor",
    },
    {
        id: "student-1",
        first_name: "Daniela",
        last_name: "Ruiz",
        email: "daniela@example.com",
        role: "student",
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

type TestContext = {
    getSubjectsDb: () => SubjectService[]
    getAssignmentsDb: () => SubjectAssignmentWithProfessorService[]
    subjectPostBodies: Array<Record<string, unknown>>
    subjectPutBodies: Array<Record<string, unknown>>
    subjectDeleteIds: string[]
    assignmentPostBodies: Array<Record<string, unknown>>
    assignmentDeleteIds: string[]
}

const setupBackendAndRender = async (): Promise<TestContext> => {
    let subjectCounter = 0
    let assignmentCounter = 0
    let subjectsDb = structuredClone(initialSubjects)
    let assignmentsDb = structuredClone(initialAssignments)
    const subjectPostBodies: Array<Record<string, unknown>> = []
    const subjectPutBodies: Array<Record<string, unknown>> = []
    const subjectDeleteIds: string[] = []
    const assignmentPostBodies: Array<Record<string, unknown>> = []
    const assignmentDeleteIds: string[] = []

    getProfessorsBySubjectMock.mockImplementation(async (subjectId: string) =>
        assignmentsDb.filter((assignment) => assignment.subject_id === subjectId)
    )

    server.use(
        http.get(`${API_BASE}/subjects`, () => {
            return HttpResponse.json({ data: subjectsDb })
        }),
        http.post(`${API_BASE}/subjects`, async ({ request }) => {
            const body = (await request.json()) as Record<string, unknown>
            subjectPostBodies.push(body)

            subjectCounter += 1
            const createdSubject: SubjectService = {
                id: `subject-new-${subjectCounter}`,
                name: String(body.name ?? ""),
                description: String(body.description ?? ""),
                semestre: String(body.semestre ?? ""),
                professor_id: "",
            }

            subjectsDb = [...subjectsDb, createdSubject]
            return HttpResponse.json({ data: createdSubject }, { status: 201 })
        }),
        http.put(`${API_BASE}/subjects/:id`, async ({ params, request }) => {
            const subjectId = String(params.id)
            const body = (await request.json()) as Record<string, unknown>
            subjectPutBodies.push(body)

            subjectsDb = subjectsDb.map((subject) =>
                subject.id === subjectId
                    ? {
                          ...subject,
                          semestre: String(body.semestre ?? subject.semestre),
                      }
                    : subject
            )

            const updatedSubject = subjectsDb.find((subject) => subject.id === subjectId)
            return HttpResponse.json({ data: updatedSubject })
        }),
        http.delete(`${API_BASE}/subjects/:id`, ({ params }) => {
            const subjectId = String(params.id)
            subjectDeleteIds.push(subjectId)
            subjectsDb = subjectsDb.filter((subject) => subject.id !== subjectId)
            assignmentsDb = assignmentsDb.filter((assignment) => assignment.subject_id !== subjectId)
            return HttpResponse.json({ data: true })
        }),
        http.post(`${API_BASE}/subjects/assignments`, async ({ request }) => {
            const body = (await request.json()) as Record<string, unknown>
            assignmentPostBodies.push(body)

            const subjectId = String(body.subjectId ?? "")
            const professorId = String(body.professorId ?? "")
            const subject = subjectsDb.find((item) => item.id === subjectId)
            const professor = usersDb.find((item) => item.id === professorId && item.role === "professor")

            if (!subject || !professor) {
                return new HttpResponse(null, { status: 400 })
            }

            assignmentCounter += 1
            const createdAssignment: SubjectAssignmentWithProfessorService = {
                id: `assignment-new-${assignmentCounter}`,
                subject_id: subject.id,
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

            return HttpResponse.json(
                [
                    {
                        id: createdAssignment.id,
                        professor_id: professor.id,
                        subject_id: subject.id,
                        assigned_at: "2026-02-25T00:00:00.000Z",
                    },
                ],
                { status: 201 }
            )
        }),
        http.delete(`${API_BASE}/subjects/assignments/:id`, ({ params }) => {
            const assignmentId = String(params.id)
            assignmentDeleteIds.push(assignmentId)
            assignmentsDb = assignmentsDb.filter((assignment) => assignment.id !== assignmentId)
            return HttpResponse.json(true)
        }),
        http.get(`${API_BASE}/users`, () => {
            return HttpResponse.json({ data: usersDb })
        })
    )

    render(<Subjects />)
    await screen.findByRole("row", { name: /matematica basica/i })

    return {
        getSubjectsDb: () => subjectsDb,
        getAssignmentsDb: () => assignmentsDb,
        subjectPostBodies,
        subjectPutBodies,
        subjectDeleteIds,
        assignmentPostBodies,
        assignmentDeleteIds,
    }
}

const getCreateDialog = () => screen.getByRole("dialog", { name: /crear nueva materia/i })

const openCreateSubjectDialog = () => {
    fireEvent.click(screen.getByRole("button", { name: /nueva materia/i }))
}

const setCreateName = (value: string) => {
    fireEvent.change(within(getCreateDialog()).getByLabelText(/nombre/i), { target: { value } })
}

const setCreateDescription = (value: string) => {
    fireEvent.change(within(getCreateDialog()).getByLabelText(/descripci/i), { target: { value } })
}

const setCreateSemester = async (semester: string) => {
    fireEvent.click(within(getCreateDialog()).getByRole("combobox", { name: /semestre/i }))
    const listbox = await screen.findByRole("listbox")
    fireEvent.click(within(listbox).getByRole("option", { name: new RegExp(semester, "i") }))
}

const saveCreateDialog = () => {
    fireEvent.click(within(getCreateDialog()).getByRole("button", { name: /crear materia/i }))
}

const openEditSemesterDialog = (subjectName: string) => {
    const row = screen.getByRole("row", { name: new RegExp(subjectName, "i") })
    fireEvent.click(within(row).getByRole("button", { name: /editar semestre/i }))
}

const getEditSemesterDialog = () => screen.getByRole("dialog", { name: /editar semestre/i })

const setEditSemester = async (semester: string) => {
    fireEvent.click(within(getEditSemesterDialog()).getByRole("combobox", { name: /semestre/i }))
    const listbox = await screen.findByRole("listbox")
    fireEvent.click(within(listbox).getByRole("option", { name: new RegExp(semester, "i") }))
}

const saveEditSemesterDialog = () => {
    fireEvent.click(within(getEditSemesterDialog()).getByRole("button", { name: /guardar/i }))
}

const openAssignmentDialog = (subjectName: string) => {
    const row = screen.getByRole("row", { name: new RegExp(subjectName, "i") })
    fireEvent.click(within(row).getByRole("button", { name: /asignar profesor/i }))
}

const getAssignmentDialog = () => screen.getByRole("dialog", { name: /asignar profesor a materia/i })

const setProfessor = async (fullName: string) => {
    fireEvent.click(within(getAssignmentDialog()).getByRole("combobox", { name: /profesor/i }))
    fireEvent.click(await screen.findByText(new RegExp(fullName, "i")))
}

const saveAssignmentDialog = () => {
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

describe("Subjects UI <> backend sync", () => {
    describe("anadir materia", () => {
        it("envia el payload correcto y renderiza la materia creada", async () => {
            const ctx = await setupBackendAndRender()

            openCreateSubjectDialog()
            setCreateName("Arquitectura de Software")
            setCreateDescription("Patrones y calidad")
            await setCreateSemester("Semestre 3")
            saveCreateDialog()

            await waitFor(() => {
                expect(screen.getByRole("row", { name: /arquitectura de software/i })).toBeInTheDocument()
            })

            expect(ctx.subjectPostBodies[0]).toEqual({
                name: "Arquitectura de Software",
                description: "Patrones y calidad",
                semestre: "Semestre 3",
            })
            expect(ctx.getSubjectsDb()).toHaveLength(3)
        })
    })

    describe("editar semestre de la materia", () => {
        it("actualiza semestre en UI y backend", async () => {
            const ctx = await setupBackendAndRender()

            openEditSemesterDialog("Fisica General")
            await setEditSemester("Semestre 1")
            saveEditSemesterDialog()

            await waitFor(() => {
                expect(screen.getByRole("row", { name: /fisica general/i })).toHaveTextContent(/semestre 1/i)
            })

            expect(ctx.subjectPutBodies[0]).toEqual({ semestre: "Semestre 1" })
            expect(ctx.getSubjectsDb().find((subject) => subject.id === "subject-old-2")?.semestre).toBe("Semestre 1")
        })
    })

    describe("asignar profesor a materia", () => {
        it("envia payload de asignacion y refleja el profesor en la UI", async () => {
            const ctx = await setupBackendAndRender()

            openAssignmentDialog("Fisica General")
            await setProfessor("Luis Perez")
            saveAssignmentDialog()

            await waitFor(() => {
                expect(screen.getByText(/luis perez/i)).toBeInTheDocument()
            })

            expect(ctx.assignmentPostBodies[0]).toEqual({
                professorId: "prof-2",
                subjectId: "subject-old-2",
            })
            expect(ctx.getAssignmentsDb().some((assignment) => assignment.user.id === "prof-2")).toBe(true)
        })
    })

    describe("eliminar asignacion", () => {
        it("elimina la asignacion en UI y backend", async () => {
            const ctx = await setupBackendAndRender()

            toggleSubjectExpansion("Matematica Basica")
            await screen.findByText(/ana lopez/i)
            openDeleteAssignmentDialog("Ana Lopez")
            confirmDeleteDialog("asignaci")

            await waitFor(() => {
                expect(screen.queryByText(/ana lopez/i)).not.toBeInTheDocument()
            })

            expect(ctx.assignmentDeleteIds).toEqual(["assignment-old-1"])
            expect(ctx.getAssignmentsDb().some((assignment) => assignment.id === "assignment-old-1")).toBe(false)
        })
    })

    describe("eliminar materia", () => {
        it("elimina la materia y sus asignaciones asociadas", async () => {
            const ctx = await setupBackendAndRender()

            openDeleteSubjectDialog("Matematica Basica")
            confirmDeleteDialog("Materia")

            await waitFor(() => {
                expect(screen.queryByRole("row", { name: /matematica basica/i })).not.toBeInTheDocument()
            })

            expect(ctx.subjectDeleteIds).toEqual(["subject-old-1"])
            expect(ctx.getSubjectsDb().some((subject) => subject.id === "subject-old-1")).toBe(false)
            expect(ctx.getAssignmentsDb().some((assignment) => assignment.subject_id === "subject-old-1")).toBe(false)
        })
    })
})
