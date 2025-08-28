"use client"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Search, Plus, Pencil, Trash2 } from "lucide-react"
import type { StageService } from "@/lib/@types/services"
import { addStage, deleteStage, getStages, updateStage } from "@/services/stages"
import { v4 as uuidv4 } from "uuid"
const initialStage = (): StageService => ({
    id: uuidv4(),
    name: "",
    description: "",
    questions: [],
    target_audience: "student",
})

const StagePage = () => {
    const [search, setSearch] = useState("")
    const [openDialog, setOpenDialog] = useState(false)
    const [stages, setStages] = useState<StageService[]>([])
    const [stage, setStage] = useState<StageService>(initialStage)
    const [textConfirmation, setTextConfirmation] = useState("")
    const [idleForm, setIdleForm] = useState<"create" | "edit">("create")
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [stageToDelete, setStageToDelete] = useState<string | null>(null)
    const [openDialogDeleteStage, setOpenDialogDeleteStage] = useState(false)

    const filteredStages = stages.filter(
        (stage) =>
            stage.name.toLowerCase().includes(search.toLowerCase()) ||
            stage.description.toLowerCase().includes(search.toLowerCase()),
    )

    const initStage = () => {
        setErrors({})
        setIdleForm("create")
        setOpenDialog(true)
        setStage(initialStage)
    }

    const handleSetEdit = (stage: StageService) => {
        setErrors({})
        setIdleForm("edit")
        setOpenDialog(true)
        setStage(stage)
    }

    const handleDeleteStage = async (stageId: string) => {
        setTextConfirmation("")
        setStageToDelete(stageId)
        setOpenDialogDeleteStage(true)
    }

    const handleConfirmDeleting = async () => {
        if (stageToDelete && textConfirmation.toLowerCase() === "eliminar") {
            await deleteStage(stageToDelete)
            setStages((previous) => previous.filter((stage) => stage.id !== stageToDelete))
            setTextConfirmation("")
            setStageToDelete(null)
            setOpenDialogDeleteStage(false)
        }
    }

    const isValidForm = (): boolean => {
        const nuevosErrores: { [key: string]: string } = {}
        if (!stage.name.trim()) {
            nuevosErrores.name = "El nombre de la etapa es obligatorio"
        } else if (
            stages.some(
                (stg) =>
                    stg.name.trim().toLowerCase() === stage.name.trim().toLowerCase() &&
                    stg.target_audience === stage.target_audience,
            )
        ) {
            if (idleForm === "create") {
                nuevosErrores.name = `Ya existe una etapa con este nombre para ${stage.target_audience === "student" ? "estudiantes" : "profesores"}`
            }
        }
        setErrors(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const handleSaveStage = async () => {
        if (!isValidForm()) {
            return false
        }
        if (idleForm === "create") {
            const newStage = await addStage(stage)
            setStages((previous) => [...previous, newStage!])
        } else {
            const updatedStage = await updateStage(stage)
            if (!updatedStage) return
            setStages((previous) => previous.map((stg) => (stg.id === stage.id ? updatedStage : stg)))
        }
        setOpenDialog(false)
        return true
    }

    const handleChange = (field: keyof StageService, value: any) => {
        setStage((prev) => ({
            ...prev,
            [field]: value,
        }))

        if (errors[field as string]) {
            setErrors((prev) => {
                const newErrors = { ...prev }
                delete newErrors[field as string]
                return newErrors
            })
        }
    }

    useEffect(() => {
        const fetchStages = async () => {
            const stages = await getStages()
            setStages(stages)
        }
        fetchStages()
    }, [])

    return (
        <section>
            <div className="container mx-auto py-6">
                <h1 className="mb-6 text-3xl font-bold">Gestión de Etapas</h1>

                <div className="mb-6 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar categorías..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                        <DialogTrigger asChild>
                            <Button onClick={initStage}>
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva Etapa
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {idleForm === "create" ? "Crear Nueva Etapa" : "Editar Etapa"}
                                </DialogTitle>
                                <DialogDescription>
                                    {idleForm === "create"
                                        ? "Crea una nueva etapa para clasificar preguntas."
                                        : "Modifica los detalles de la etapa."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="flex items-center">
                                        Nombre <span className="text-red-500 ml-1">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={stage.name}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        placeholder="Ej: Metodología de enseñanza"
                                        className={errors.name ? "border-red-500" : ""}
                                    />
                                    {errors.name && <span className="text-sm text-red-500">{errors.name}</span>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Descripción</Label>
                                    <Textarea
                                        id="description"
                                        value={stage.description}
                                        onChange={(e) => handleChange("description", e.target.value)}
                                        placeholder="Describe el propósito de esta categoría..."
                                        className="min-h-[80px]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="target_audience" className="flex items-center">
                                        Tipo de la etapa <span className="text-red-500 ml-1">*</span>
                                    </Label>
                                    <Select
                                        value={stage.target_audience}
                                        onValueChange={(valor) => handleChange("target_audience", valor)}
                                    >
                                        <SelectTrigger
                                            id="target_audience"
                                            className={errors.target_audience ? "border-red-500" : ""}
                                        >
                                            <SelectValue placeholder="Seleccionar target_audience" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="student">Para Estudiantes</SelectItem>
                                            <SelectItem value="professor">Para Profesores</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <span className="text-xs text-muted-foreground">
                                        Indica si esta etapa de preguntas será respondida por estudiantes o profesores.
                                    </span>
                                    {errors.target_audience && (
                                        <span className="text-sm text-red-500">{errors.target_audience}</span>
                                    )}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleSaveStage}>
                                    {idleForm === "create" ? "Crear Etapa" : "Guardar Cambios"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Audiencia</TableHead>
                                    <TableHead>Preguntas</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStages.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No se encontraron categorías que coincidan con la búsqueda.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStages.map((stage) => (
                                        <TableRow key={stage.id}>
                                            <TableCell className="font-medium">{stage.name}</TableCell>
                                            <TableCell className="max-w-xs truncate">{stage.description}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        stage.target_audience === "student" ? "default" : "secondary"
                                                    }
                                                >
                                                    {stage.target_audience === "student" ? "Estudiante" : "Profesor"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{stage.questions.length}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleSetEdit(stage)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        <span className="sr-only">Editar</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title={
                                                            stage.questions.length > 0
                                                                ? "No se puede eliminar una categoría con preguntas asociadas"
                                                                : "Eliminar categoría"
                                                        }
                                                        onClick={() => handleDeleteStage(stage.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                        <span className="sr-only">Eliminar</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <Dialog open={openDialogDeleteStage} onOpenChange={setOpenDialogDeleteStage}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Confirmar eliminación de categoría</DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-4 pt-2">
                                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
                                    <span className="font-medium">¡Atención! Esta acción no se spanuede deshacer.</span>
                                    <span className="mt-1">
                                        Está a punto de eliminar permanentemente una categoría del sistema. Esta acción:
                                    </span>
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        <li>Eliminará la categoría de forma permanente</li>
                                        <li>Podría afectar a la organización de las preguntas</li>
                                        <li>Podría impactar en reportes históricos</li>
                                    </ul>
                                </div>
                                <span>
                                    Para confirmar que desea eliminar esta categoría, escriba{" "}
                                    <span className="font-bold">eliminar</span> en el campo a continuación:
                                </span>
                                <Input
                                    value={textConfirmation}
                                    onChange={(e) => setTextConfirmation(e.target.value)}
                                    placeholder="Escriba 'eliminar' para confirmar"
                                    className="mt-2"
                                />
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setOpenDialogDeleteStage(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDeleting}
                            disabled={textConfirmation.toLowerCase() !== "eliminar"}
                        >
                            Eliminar Categoría
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}

export default StagePage
