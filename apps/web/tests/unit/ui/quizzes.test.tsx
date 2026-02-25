import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Question, StageService } from "@/lib/@types/services"
import { Quizzes } from "@/ui/quizzes/quizzes"

const { getQuestionsMock, addQuestionMock, updateQuestionMock, deleteQuestionMock, getStagesMock } = vi.hoisted(() => ({
    getQuestionsMock: vi.fn(),
    addQuestionMock: vi.fn(),
    updateQuestionMock: vi.fn(),
    deleteQuestionMock: vi.fn(),
    getStagesMock: vi.fn(),
}))

vi.mock("@/services/questions", () => ({
    getQuestions: getQuestionsMock,
    addQuestion: addQuestionMock,
    updateQuestion: updateQuestionMock,
    deleteQuestion: deleteQuestionMock,
}))

vi.mock("@/services/stages", () => ({
    getStages: getStagesMock,
}))

const initialStages: StageService[] = [
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
    {
        id: "question-old-2",
        title: "Pregunta inicial docente",
        description: "Descripcion docente",
        question_type: "single_choice",
        required: true,
        target_audience: "professor",
        stage_id: "stage-2",
        stage: { id: "stage-2", name: "Etapa 2" },
        options: ["Bajo", "Medio", "Alto"],
    },
]

const openCreateDialog = () => {
    fireEvent.click(screen.getByRole("button", { name: /nueva pregunta/i }))
}

const getQuestionDialog = () => screen.getByRole("dialog", { name: /crear nueva pregunta|editar pregunta/i })
let editingQuestionTitle: string | null = null

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

describe("Quizzes page", () => {
    let stagesDb: StageService[]
    let questionsDb: Question[]

    beforeEach(() => {
        stagesDb = structuredClone(initialStages)
        questionsDb = structuredClone(initialQuestions)
        editingQuestionTitle = null

        getStagesMock.mockImplementation(async () => stagesDb)
        getQuestionsMock.mockImplementation(async () => questionsDb)
        addQuestionMock.mockImplementation(async (question: Question) => {
            const selectedStage = stagesDb.find((stage) => stage.id === question.stage_id)
            const createdQuestion: Question = {
                ...question,
                stage: selectedStage ? { id: selectedStage.id, name: selectedStage.name } : null,
                options: question.options ?? [],
            }
            questionsDb = [...questionsDb, createdQuestion]
            return createdQuestion
        })
        updateQuestionMock.mockImplementation(async (question: Question) => {
            const selectedStage = stagesDb.find((stage) => stage.id === question.stage_id)
            const fallbackId = questionsDb.find((item) => item.title === editingQuestionTitle)?.id
            const targetId = questionsDb.some((item) => item.id === question.id) ? question.id : fallbackId
            questionsDb = questionsDb.map((currentQuestion) =>
                currentQuestion.id === targetId
                    ? {
                          ...currentQuestion,
                          ...question,
                          stage: selectedStage ? { id: selectedStage.id, name: selectedStage.name } : null,
                          options: question.options ?? [],
                      }
                    : currentQuestion
            )
            return questionsDb.find((currentQuestion) => currentQuestion.id === targetId) ?? null
        })
        deleteQuestionMock.mockImplementation(async (questionId: string) => {
            questionsDb = questionsDb.filter((question) => question.id !== questionId)
            return true
        })
    })

    it("renders retrieved questions and supports search filtering", async () => {
        render(<Quizzes />)

        expect(await screen.findByRole("row", { name: /pregunta inicial estudiante/i })).toBeInTheDocument()
        expect(screen.getByRole("row", { name: /pregunta inicial docente/i })).toBeInTheDocument()

        fireEvent.change(screen.getByPlaceholderText(/buscar preguntas/i), { target: { value: "docente" } })
        expect(screen.queryByRole("row", { name: /pregunta inicial estudiante/i })).not.toBeInTheDocument()
        expect(screen.getByRole("row", { name: /pregunta inicial docente/i })).toBeInTheDocument()
    })

    it("handles full lifecycle: add by stage/type/audience, edit and remove all questions", async () => {
        render(<Quizzes />)
        await screen.findByRole("row", { name: /pregunta inicial estudiante/i })

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

        openCreateDialog()
        setTitle("Unica Etapa 2")
        setDescription("Contexto etapa 2")
        await selectAudience("professor")
        await selectStage("Etapa 2")
        await selectQuestionType("single_choice")
        setOptions("Bajo\nMedio\nAlto")
        saveQuestion()
        await waitFor(() => {
            expect(screen.getByRole("row", { name: /unica etapa 2/i })).toBeInTheDocument()
        })

        openCreateDialog()
        setTitle("Multiple Etapa 3")
        setDescription("Contexto etapa 3")
        await selectAudience("student")
        await selectStage("Etapa 3")
        await selectQuestionType("multiple_choice")
        setOptions("A\nB\nC")
        saveQuestion()
        await waitFor(() => {
            expect(screen.getByRole("row", { name: /multiple etapa 3/i })).toBeInTheDocument()
        })

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

        openEditDialog("Pregunta inicial estudiante")
        setTitle("Pregunta editada docente")
        setDescription("Descripcion editada")
        await selectAudience("professor")
        await selectStage("Etapa 2")
        await selectQuestionType("numeric")
        saveQuestion()
        await waitFor(() => {
            expect(screen.getByRole("row", { name: /pregunta editada docente/i })).toBeInTheDocument()
        })

        deleteQuestionFromRow("Texto Etapa 1")
        await waitFor(() => {
            expect(screen.queryByRole("row", { name: /texto etapa 1/i })).not.toBeInTheDocument()
        })

        deleteQuestionFromRow("Pregunta inicial docente")
        await waitFor(() => {
            expect(screen.queryByRole("row", { name: /pregunta inicial docente/i })).not.toBeInTheDocument()
        })

        deleteQuestionFromRow("Multiple Etapa 3")
        await waitFor(() => {
            expect(screen.queryByRole("row", { name: /multiple etapa 3/i })).not.toBeInTheDocument()
        })

        deleteQuestionFromRow("Numerica Docente")
        await waitFor(() => {
            expect(screen.queryByRole("row", { name: /numerica docente/i })).not.toBeInTheDocument()
        })

        deleteQuestionFromRow("Unica Etapa 2")
        await waitFor(() => {
            expect(screen.queryByRole("row", { name: /unica etapa 2/i })).not.toBeInTheDocument()
        })

        deleteQuestionFromRow("Pregunta editada docente")
        await waitFor(() => {
            expect(screen.getByText(/no se encontraron preguntas/i)).toBeInTheDocument()
        })

        expect(addQuestionMock).toHaveBeenCalledTimes(4)
        expect(updateQuestionMock).toHaveBeenCalledTimes(1)
        expect(deleteQuestionMock).toHaveBeenCalledTimes(6)
    })
})
