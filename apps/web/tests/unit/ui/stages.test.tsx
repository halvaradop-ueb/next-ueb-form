import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { StageService } from "@/lib/@types/services"
import { Stages } from "@/ui/stages/stages"

const { getStagesMock, addStageMock, updateStageMock, deleteStageMock } = vi.hoisted(() => ({
    getStagesMock: vi.fn(),
    addStageMock: vi.fn(),
    updateStageMock: vi.fn(),
    deleteStageMock: vi.fn(),
}))

vi.mock("@/services/stages", () => ({
    getStages: getStagesMock,
    addStage: addStageMock,
    updateStage: updateStageMock,
    deleteStage: deleteStageMock,
}))

const initialStages: StageService[] = [
    {
        id: "stage-old-1",
        name: "Metodologia",
        description: "Analisis de planificacion",
        target_audience: "student",
        questions: [{ id: "q1", title: "Q1", description: "D1" }],
    },
    {
        id: "stage-old-2",
        name: "Participacion",
        description: "Interaccion en clase",
        target_audience: "professor",
        questions: [
            { id: "q2", title: "Q2", description: "D2" },
            { id: "q3", title: "Q3", description: "D3" },
        ],
    },
    {
        id: "stage-old-3",
        name: "Evaluacion Final",
        description: "Resultado general",
        target_audience: "student",
        questions: [],
    },
]

describe("Stages page", () => {
    let stagesDb: StageService[]

    beforeEach(() => {
        stagesDb = structuredClone(initialStages)

        getStagesMock.mockImplementation(async () => stagesDb)
        addStageMock.mockImplementation(async (stage: StageService) => {
            const createdStage = { ...stage }
            stagesDb = [...stagesDb, createdStage]
            return createdStage
        })
        updateStageMock.mockImplementation(async (stage: StageService) => {
            stagesDb = stagesDb.map((currentStage) =>
                currentStage.id === stage.id ? { ...currentStage, ...stage } : currentStage
            )
            return stagesDb.find((currentStage) => currentStage.id === stage.id) ?? null
        })
        deleteStageMock.mockImplementation(async (stageId: string) => {
            stagesDb = stagesDb.filter((stage) => stage.id !== stageId)
            return true
        })
    })

    const openCreateDialog = () => {
        fireEvent.click(screen.getByRole("button", { name: /nueva etapa/i }))
    }

    const fillStageForm = (name: string, description: string) => {
        fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: name } })
        fireEvent.change(screen.getByLabelText(/descripci/i), { target: { value: description } })
    }

    const saveStage = () => {
        fireEvent.click(screen.getByRole("button", { name: /crear etapa|guardar cambios/i }))
    }

    const clickRowAction = (rowName: string, action: "Editar" | "Eliminar") => {
        const row = screen.getByRole("row", { name: new RegExp(rowName, "i") })
        fireEvent.click(within(row).getByRole("button", { name: new RegExp(action, "i") }))
    }

    const confirmDelete = () => {
        fireEvent.change(screen.getByPlaceholderText(/eliminar/i), { target: { value: "eliminar" } })
        fireEvent.click(screen.getByRole("button", { name: /eliminar etapa/i }))
    }

    it("renders retrieved stages with audience, counts and search filtering", async () => {
        render(<Stages />)

        expect(await screen.findByRole("row", { name: /metodologia/i })).toBeInTheDocument()
        expect(screen.getByRole("row", { name: /participacion/i })).toBeInTheDocument()
        expect(screen.getByRole("row", { name: /evaluacion final/i })).toBeInTheDocument()

        expect(screen.getAllByText("Estudiante").length).toBeGreaterThan(0)
        expect(screen.getAllByText("Profesor").length).toBeGreaterThan(0)
        expect(screen.getByText("2")).toBeInTheDocument()

        fireEvent.change(screen.getByPlaceholderText(/buscar/i), { target: { value: "participacion" } })
        expect(screen.queryByRole("row", { name: /metodologia/i })).not.toBeInTheDocument()
        expect(screen.getByRole("row", { name: /participacion/i })).toBeInTheDocument()
    })

    it("handles full lifecycle: add multiple, edit old/new, remove one, remove all", async () => {
        render(<Stages />)
        await screen.findByRole("row", { name: /metodologia/i })

        openCreateDialog()
        fillStageForm("Comunicacion 360", "Feedback bidireccional")
        saveStage()

        await waitFor(() => {
            expect(screen.getByRole("row", { name: /comunicacion 360/i })).toBeInTheDocument()
        })

        openCreateDialog()
        fillStageForm("Innovacion Docente", "Diseno y mejora continua")
        saveStage()

        await waitFor(() => {
            expect(screen.getByRole("row", { name: /innovacion docente/i })).toBeInTheDocument()
        })

        clickRowAction("Participacion", "Editar")
        fillStageForm("Participacion Actualizada", "Interaccion activa y guiada")
        saveStage()

        await waitFor(() => {
            expect(screen.getByRole("row", { name: /participacion actualizada/i })).toBeInTheDocument()
        })

        clickRowAction("Comunicacion 360", "Editar")
        fillStageForm("Comunicacion Estrategica", "Feedback integral")
        saveStage()

        await waitFor(() => {
            expect(screen.getByRole("row", { name: /comunicacion estrategica/i })).toBeInTheDocument()
            expect(screen.queryByRole("row", { name: /comunicacion 360/i })).not.toBeInTheDocument()
        })

        clickRowAction("Metodologia", "Eliminar")
        confirmDelete()

        await waitFor(() => {
            expect(screen.queryByRole("row", { name: /metodologia/i })).not.toBeInTheDocument()
        })

        clickRowAction("Participacion Actualizada", "Eliminar")
        confirmDelete()
        await waitFor(() => {
            expect(screen.queryByRole("row", { name: /participacion actualizada/i })).not.toBeInTheDocument()
        })

        clickRowAction("Evaluacion Final", "Eliminar")
        confirmDelete()
        await waitFor(() => {
            expect(screen.queryByRole("row", { name: /evaluacion final/i })).not.toBeInTheDocument()
        })

        clickRowAction("Comunicacion Estrategica", "Eliminar")
        confirmDelete()
        await waitFor(() => {
            expect(screen.queryByRole("row", { name: /comunicacion estrategica/i })).not.toBeInTheDocument()
        })

        clickRowAction("Innovacion Docente", "Eliminar")
        confirmDelete()

        await waitFor(() => {
            expect(screen.getByText(/no se encontraron/i)).toBeInTheDocument()
        })

        expect(getStagesMock).toHaveBeenCalledTimes(1)
        expect(addStageMock).toHaveBeenCalledTimes(2)
        expect(updateStageMock).toHaveBeenCalledTimes(2)
        expect(deleteStageMock).toHaveBeenCalledTimes(5)
    })
})
