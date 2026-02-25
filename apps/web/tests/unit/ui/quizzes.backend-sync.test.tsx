import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import type { Question, StageService } from "@/lib/@types/services"
import { Quizzes } from "@/ui/quizzes/quizzes"
import { server } from "../setup"

const API_BASE = "http://localhost:4000/api/v1"

const stagesDb: StageService[] = [
    {
        id: "stage-1",
        name: "Etapa 1",
        description: "Inicio",
        target_audience: "student",
        questions: [],
    },
    {
        id: "stage-2",
        name: "Etapa 2",
        description: "Docencia",
        target_audience: "professor",
        questions: [],
    },
    {
        id: "stage-3",
        name: "Etapa 3",
        description: "Cierre",
        target_audience: "student",
        questions: [],
    },
]

const initialQuestions: Question[] = [
    {
        id: "question-old-1",
        title: "Pregunta inicial estudiante",
        description: "Descripcion inicial",
        question_type: "text",
        required: true,
        target_audience: "student",
        stage_id: "stage-1",
        stage: { id: "stage-1", name: "Etapa 1" },
        options: [],
    },
]

type TestContext = {
    getQuestionsDb: () => Question[]
    postBodies: Question[]
    putBodies: Question[]
    deleteIds: string[]
}

let editingQuestionTitle: string | null = null

const setupBackendAndRender = async (): Promise<TestContext> => {
    let questionsDb = structuredClone(initialQuestions)
    editingQuestionTitle = null
    const postBodies: Question[] = []
    const putBodies: Question[] = []
    const deleteIds: string[] = []

    server.use(
        http.get(`${API_BASE}/questions`, () => {
            return HttpResponse.json({ questions: questionsDb })
        }),
        http.post(`${API_BASE}/questions`, async ({ request }) => {
            const body = (await request.json()) as Question
            postBodies.push(body)

            const selectedStage = stagesDb.find((stage) => stage.id === body.stage_id)
            const createdQuestion: Question = {
                ...body,
                stage: selectedStage ? { id: selectedStage.id, name: selectedStage.name } : null,
                options: body.options ?? [],
            }

            questionsDb = [...questionsDb, createdQuestion]
            return HttpResponse.json(createdQuestion, { status: 201 })
        }),
        http.put(`${API_BASE}/questions`, async ({ request }) => {
            const body = (await request.json()) as Question
            putBodies.push(body)
            const selectedStage = stagesDb.find((stage) => stage.id === body.stage_id)
            const fallbackId = questionsDb.find((question) => question.title === editingQuestionTitle)?.id
            const targetId = questionsDb.some((question) => question.id === body.id) ? body.id : fallbackId

            questionsDb = questionsDb.map((question) =>
                question.id === targetId
                    ? {
                          ...question,
                          ...body,
                          stage: selectedStage ? { id: selectedStage.id, name: selectedStage.name } : null,
                          options: body.options ?? [],
                      }
                    : question
            )

            const updatedQuestion = questionsDb.find((question) => question.id === targetId || question.title === body.title)
            return HttpResponse.json(updatedQuestion ?? null)
        }),
        http.delete(`${API_BASE}/questions`, ({ request }) => {
            const id = new URL(request.url).searchParams.get("id") ?? ""
            deleteIds.push(id)
            questionsDb = questionsDb.filter((question) => question.id !== id)
            return HttpResponse.json({ success: true })
        }),
        http.get(`${API_BASE}/stages`, () => {
            return HttpResponse.json({ data: stagesDb })
        })
    )

    render(<Quizzes />)
    await screen.findByRole("row", { name: /pregunta inicial estudiante/i })

    return {
        getQuestionsDb: () => questionsDb,
        postBodies,
        putBodies,
        deleteIds,
    }
}

const openCreateDialog = () => {
    fireEvent.click(screen.getByRole("button", { name: /nueva pregunta/i }))
}

const getQuestionDialog = () => screen.getByRole("dialog", { name: /crear nueva pregunta|editar pregunta/i })

const setTitle = (value: string) => {
    fireEvent.change(within(getQuestionDialog()).getByPlaceholderText(/calificar/i), { target: { value } })
}

const setDescription = (value: string) => {
    fireEvent.change(within(getQuestionDialog()).getByPlaceholderText(/contexto/i), { target: { value } })
}

const selectDialogOption = async (comboboxLabel: RegExp, optionLabel: RegExp) => {
    fireEvent.click(within(getQuestionDialog()).getByRole("combobox", { name: comboboxLabel }))
    const listbox = await screen.findByRole("listbox")
    fireEvent.click(within(listbox).getByRole("option", { name: optionLabel }))
}

const selectAudience = async (audience: "student" | "professor") => {
    const audienceLabel = audience === "student" ? /estudiantes/i : /docentes/i
    await selectDialogOption(/audiencia/i, audienceLabel)
}

const selectStage = async (stageName: string) => {
    await selectDialogOption(/etapa/i, new RegExp(stageName, "i"))
}

const selectQuestionType = async (type: "text" | "single_choice" | "multiple_choice" | "numeric") => {
    if (type === "text") {
        await selectDialogOption(/tipo de pregunta/i, /respuesta de texto/i)
        return
    }
    if (type === "single_choice") {
        await selectDialogOption(/tipo de pregunta/i, /selecci.*nica/i)
        return
    }
    if (type === "multiple_choice") {
        await selectDialogOption(/tipo de pregunta/i, /selecci.*m.ltiple/i)
        return
    }
    await selectDialogOption(/tipo de pregunta/i, /num/i)
}

const setOptions = (value: string) => {
    fireEvent.change(within(getQuestionDialog()).getByLabelText(/opciones/i), { target: { value } })
}

const saveQuestion = () => {
    fireEvent.click(within(getQuestionDialog()).getByRole("button", { name: /crear pregunta|guardar cambios/i }))
}

const openEditDialog = (questionTitle: string) => {
    editingQuestionTitle = questionTitle
    const row = screen.getByRole("row", { name: new RegExp(questionTitle, "i") })
    fireEvent.click(within(row).getByRole("button", { name: /editar/i }))
}

const deleteQuestionFromRow = (questionTitle: string) => {
    const row = screen.getByRole("row", { name: new RegExp(questionTitle, "i") })
    fireEvent.click(within(row).getByRole("button", { name: /eliminar/i }))
    const alertDialog = screen.getByRole("alertdialog")
    fireEvent.click(within(alertDialog).getByRole("button", { name: /eliminar/i }))
}

describe("Quizzes UI <> backend sync", () => {
    describe("anadir pregunta en etapa 1", () => {
        it("crea pregunta tipo texto para estudiantes", async () => {
            const ctx = await setupBackendAndRender()

            openCreateDialog()
            setTitle("Texto Etapa 1")
            setDescription("Contexto etapa 1")
            await selectAudience("student")
            await selectStage("Etapa 1")
            await selectQuestionType("text")
            saveQuestion()

            await waitFor(() => {
                expect(screen.getByRole("row", { name: /texto etapa 1/i })).toBeInTheDocument()
            })

            expect(ctx.postBodies[0]).toEqual(
                expect.objectContaining({
                    title: "Texto Etapa 1",
                    description: "Contexto etapa 1",
                    stage_id: "stage-1",
                    target_audience: "student",
                    question_type: "text",
                })
            )
            expect(ctx.getQuestionsDb().some((question) => question.title === "Texto Etapa 1")).toBe(true)
        })
    })

    describe("anadir pregunta en etapa 2", () => {
        it("crea pregunta de seleccion unica para docentes", async () => {
            const ctx = await setupBackendAndRender()

            openCreateDialog()
            setTitle("Unica Etapa 2")
            setDescription("Contexto etapa 2")
            await selectAudience("professor")
            await selectStage("Etapa 2")
            await selectQuestionType("single_choice")
            setOptions("Muy bajo\nMedio\nAlto")
            saveQuestion()

            await waitFor(() => {
                expect(screen.getByRole("row", { name: /unica etapa 2/i })).toBeInTheDocument()
            })

            expect(ctx.postBodies[0]).toEqual(
                expect.objectContaining({
                    title: "Unica Etapa 2",
                    stage_id: "stage-2",
                    target_audience: "professor",
                    question_type: "single_choice",
                    options: ["Muy bajo", "Medio", "Alto"],
                })
            )
        })
    })

    describe("anadir pregunta en etapa 3", () => {
        it("crea pregunta de seleccion multiple para estudiantes", async () => {
            const ctx = await setupBackendAndRender()

            openCreateDialog()
            setTitle("Multiple Etapa 3")
            setDescription("Contexto etapa 3")
            await selectAudience("student")
            await selectStage("Etapa 3")
            await selectQuestionType("multiple_choice")
            setOptions("Opcion A\nOpcion B\nOpcion C")
            saveQuestion()

            await waitFor(() => {
                expect(screen.getByRole("row", { name: /multiple etapa 3/i })).toBeInTheDocument()
            })

            expect(ctx.postBodies[0]).toEqual(
                expect.objectContaining({
                    title: "Multiple Etapa 3",
                    stage_id: "stage-3",
                    target_audience: "student",
                    question_type: "multiple_choice",
                    options: ["Opcion A", "Opcion B", "Opcion C"],
                })
            )
        })
    })

    describe("tipo de pregunta numerica", () => {
        it("crea pregunta numerica para docentes", async () => {
            const ctx = await setupBackendAndRender()

            openCreateDialog()
            setTitle("Numerica Docente")
            setDescription("Valor numerico")
            await selectAudience("professor")
            await selectStage("Etapa 2")
            await selectQuestionType("numeric")
            saveQuestion()

            await waitFor(() => {
                expect(screen.getByRole("row", { name: /numerica docente/i })).toBeInTheDocument()
            })

            expect(ctx.postBodies[0]).toEqual(
                expect.objectContaining({
                    title: "Numerica Docente",
                    stage_id: "stage-2",
                    target_audience: "professor",
                    question_type: "numeric",
                })
            )
        })
    })

    describe("editar pregunta", () => {
        it("edita etapa, tipo de pregunta y audiencia", async () => {
            const ctx = await setupBackendAndRender()

            openEditDialog("Pregunta inicial estudiante")
            setTitle("Pregunta editada docente")
            setDescription("Descripcion editada")
            await selectAudience("professor")
            await selectStage("Etapa 2")
            await selectQuestionType("numeric")
            saveQuestion()

            await waitFor(() => {
                expect(screen.getByRole("row", { name: /pregunta editada docente/i })).toBeInTheDocument()
                expect(screen.queryByRole("row", { name: /pregunta inicial estudiante/i })).not.toBeInTheDocument()
            })

            expect(ctx.putBodies[0]).toEqual(
                expect.objectContaining({
                    id: expect.any(String),
                    title: "Pregunta editada docente",
                    description: "Descripcion editada",
                    stage_id: "stage-2",
                    target_audience: "professor",
                    question_type: "numeric",
                })
            )
            const updated = ctx.getQuestionsDb().find((question) => question.title === "Pregunta editada docente")
            expect(updated?.stage_id).toBe("stage-2")
            expect(updated?.target_audience).toBe("professor")
            expect(updated?.question_type).toBe("numeric")
        })
    })

    describe("eliminar pregunta", () => {
        it("elimina la pregunta en UI y backend", async () => {
            const ctx = await setupBackendAndRender()

            deleteQuestionFromRow("Pregunta inicial estudiante")

            await waitFor(() => {
                expect(screen.queryByRole("row", { name: /pregunta inicial estudiante/i })).not.toBeInTheDocument()
            })

            expect(ctx.deleteIds).toEqual(["question-old-1"])
            expect(ctx.getQuestionsDb()).toHaveLength(0)
        })
    })
})
