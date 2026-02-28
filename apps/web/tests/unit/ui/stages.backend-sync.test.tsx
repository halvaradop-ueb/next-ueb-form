import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"
import type { StageService } from "@/lib/@types/services"
import { Stages } from "@/ui/stages/stages"
import { server } from "../setup"

const API_BASE = "http://localhost:4000/api/v1"

const initialStages: StageService[] = [
    {
        id: "stage-old-1",
        name: "Metodologia",
        description: "Planificacion",
        target_audience: "student",
        questions: [],
    },
    {
        id: "stage-old-2",
        name: "Participacion",
        description: "Interaccion",
        target_audience: "professor",
        questions: [],
    },
    {
        id: "stage-old-3",
        name: "Evaluacion Final",
        description: "Resultado",
        target_audience: "student",
        questions: [],
    },
]

type TestContext = {
    getStagesDb: () => StageService[]
    postBodies: Array<Record<string, unknown>>
    putBodies: Array<Record<string, unknown>>
    deleteIds: string[]
}

const setupBackendAndRender = async (): Promise<TestContext> => {
    let idCounter = 0
    let stagesDb: StageService[] = structuredClone(initialStages)
    const postBodies: Array<Record<string, unknown>> = []
    const putBodies: Array<Record<string, unknown>> = []
    const deleteIds: string[] = []

    server.use(
        http.get(`${API_BASE}/stages`, () => {
            return HttpResponse.json({ data: stagesDb })
        }),
        http.post(`${API_BASE}/stages`, async ({ request }) => {
            const body = (await request.json()) as Record<string, unknown>
            postBodies.push(body)

            idCounter += 1
            const createdStage: StageService = {
                id: `stage-new-${idCounter}`,
                name: String(body.name ?? ""),
                description: String(body.description ?? ""),
                target_audience: body.target_audience === "professor" ? "professor" : "student",
                questions: [],
            }

            stagesDb = [...stagesDb, createdStage]
            return HttpResponse.json({ data: createdStage }, { status: 201 })
        }),
        http.put(`${API_BASE}/stages/:id`, async ({ params, request }) => {
            const stageId = String(params.id)
            const body = (await request.json()) as Record<string, unknown>
            putBodies.push(body)

            stagesDb = stagesDb.map((stage) =>
                stage.id === stageId
                    ? {
                          ...stage,
                          name: String(body.name ?? stage.name),
                          description: String(body.description ?? stage.description),
                          target_audience: body.target_audience === "professor" ? "professor" : "student",
                      }
                    : stage
            )

            const updatedStage = stagesDb.find((stage) => stage.id === stageId)
            return HttpResponse.json({ data: updatedStage })
        }),
        http.delete(`${API_BASE}/stages/:id`, ({ params }) => {
            const stageId = String(params.id)
            deleteIds.push(stageId)
            stagesDb = stagesDb.filter((stage) => stage.id !== stageId)
            return HttpResponse.json(true)
        })
    )

    render(<Stages />)

    await screen.findByRole("row", { name: /metodologia/i })

    return {
        getStagesDb: () => stagesDb,
        postBodies,
        putBodies,
        deleteIds,
    }
}

const getEditorDialog = () => screen.getByRole("dialog", { name: /crear nueva etapa|editar etapa/i })

const openCreateDialog = () => {
    fireEvent.click(screen.getByRole("button", { name: /nueva etapa/i }))
}

const openEditDialog = (stageName: string) => {
    const row = screen.getByRole("row", { name: new RegExp(stageName, "i") })
    fireEvent.click(within(row).getByRole("button", { name: /editar/i }))
}

const setName = (value: string) => {
    fireEvent.change(within(getEditorDialog()).getByLabelText(/nombre/i), { target: { value } })
}

const setDescription = (value: string) => {
    fireEvent.change(within(getEditorDialog()).getByLabelText(/descripci/i), { target: { value } })
}

const setAudience = async (audience: "student" | "professor") => {
    const label = audience === "student" ? /para estudiantes/i : /para profesores/i
    fireEvent.click(within(getEditorDialog()).getByRole("combobox", { name: /tipo de la etapa/i }))
    fireEvent.click(await screen.findByText(label))
}

const saveStageForm = () => {
    fireEvent.click(within(getEditorDialog()).getByRole("button", { name: /crear etapa|guardar cambios/i }))
}

const deleteStageFromRow = (stageName: string) => {
    const row = screen.getByRole("row", { name: new RegExp(stageName, "i") })
    fireEvent.click(within(row).getByRole("button", { name: /eliminar/i }))
    fireEvent.change(screen.getByPlaceholderText(/eliminar/i), { target: { value: "eliminar" } })
    fireEvent.click(screen.getByRole("button", { name: /eliminar etapa/i }))
}

describe("Stages UI <> backend sync", () => {
    beforeEach(() => {
        // explicit reset happens in global test setup; this keeps per-describe intent clear
    })

    describe("anadir etapa para estudiante", () => {
        it("envia payload de estudiante y renderiza la nueva etapa", async () => {
            const ctx = await setupBackendAndRender()

            openCreateDialog()
            setName("Comunicacion 360")
            setDescription("Feedback bidireccional")
            saveStageForm()

            await waitFor(() => {
                expect(screen.getByRole("row", { name: /comunicacion 360/i })).toBeInTheDocument()
            })

            expect(ctx.postBodies[0]).toEqual({
                name: "Comunicacion 360",
                description: "Feedback bidireccional",
                target_audience: "student",
            })
            expect(ctx.getStagesDb()).toHaveLength(4)
        })
    })

    describe("anadir etapa para docente", () => {
        it("envia payload de professor y renderiza la etapa creada", async () => {
            const ctx = await setupBackendAndRender()

            openCreateDialog()
            setName("Tutoria Avanzada")
            setDescription("Acompanamiento docente")
            await setAudience("professor")
            saveStageForm()

            await waitFor(() => {
                expect(screen.getByRole("row", { name: /tutoria avanzada/i })).toBeInTheDocument()
            })

            expect(ctx.postBodies[0]).toEqual({
                name: "Tutoria Avanzada",
                description: "Acompanamiento docente",
                target_audience: "professor",
            })
            expect(ctx.getStagesDb().find((stage) => stage.name === "Tutoria Avanzada")?.target_audience).toBe("professor")
        })
    })

    describe("editar nombre de la etapa", () => {
        it("actualiza el nombre en UI y backend", async () => {
            const ctx = await setupBackendAndRender()

            openEditDialog("Metodologia")
            setName("Metodologia Actualizada")
            saveStageForm()

            await waitFor(() => {
                expect(screen.getByRole("row", { name: /metodologia actualizada/i })).toBeInTheDocument()
            })

            expect(ctx.putBodies[0]?.name).toBe("Metodologia Actualizada")
            expect(ctx.getStagesDb().find((stage) => stage.id === "stage-old-1")?.name).toBe("Metodologia Actualizada")
        })
    })

    describe("editar descripcion de la etapa", () => {
        it("actualiza la descripcion en UI y backend", async () => {
            const ctx = await setupBackendAndRender()

            openEditDialog("Participacion")
            setDescription("Interaccion activa y guiada")
            saveStageForm()

            await waitFor(() => {
                expect(screen.getByRole("row", { name: /participacion/i })).toBeInTheDocument()
            })

            expect(ctx.putBodies[0]?.description).toBe("Interaccion activa y guiada")
            expect(ctx.getStagesDb().find((stage) => stage.id === "stage-old-2")?.description).toBe("Interaccion activa y guiada")
        })
    })

    describe("editar tipo de la etapa", () => {
        it("cambia de estudiante a docente y persiste en backend", async () => {
            const ctx = await setupBackendAndRender()

            openEditDialog("Metodologia")
            await setAudience("professor")
            saveStageForm()

            await waitFor(() => {
                expect(screen.getByRole("row", { name: /metodologia/i })).toBeInTheDocument()
            })

            expect(ctx.putBodies[0]?.target_audience).toBe("professor")
            expect(ctx.getStagesDb().find((stage) => stage.id === "stage-old-1")?.target_audience).toBe("professor")
        })

        it("cambia de docente a estudiante y persiste en backend", async () => {
            const ctx = await setupBackendAndRender()

            openEditDialog("Participacion")
            await setAudience("student")
            saveStageForm()

            await waitFor(() => {
                expect(screen.getByRole("row", { name: /participacion/i })).toBeInTheDocument()
            })

            expect(ctx.putBodies[0]?.target_audience).toBe("student")
            expect(ctx.getStagesDb().find((stage) => stage.id === "stage-old-2")?.target_audience).toBe("student")
        })
    })

    describe("eliminar etapa", () => {
        it("elimina una etapa y refleja el cambio en UI y backend", async () => {
            const ctx = await setupBackendAndRender()

            deleteStageFromRow("Evaluacion Final")

            await waitFor(() => {
                expect(screen.queryByRole("row", { name: /evaluacion final/i })).not.toBeInTheDocument()
            })

            expect(ctx.deleteIds).toEqual(["stage-old-3"])
            expect(ctx.getStagesDb().some((stage) => stage.id === "stage-old-3")).toBe(false)
        })
    })
})
