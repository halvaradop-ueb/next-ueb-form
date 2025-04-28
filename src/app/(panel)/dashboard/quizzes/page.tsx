"use client"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Question } from "@/lib/@types/services"
import { addQuestion, deleteQuestion, getQuestions, updateQuestion } from "@/services/questions"
import { Search, Plus, Pencil, Trash2, AlertCircle } from "lucide-react"

const questionTypes: Record<Question["question_type"], string> = {
    text: "Texto",
    single_choice: "Selección única",
    multiple_choice: "Selección múltiple",
}

const categories: Record<string, string> = {
    General: "General",
    Personal: "Personal",
}

const initialState: Question = {
    id: "",
    title: "",
    description: "",
    question_type: "text",
    category: "General",
    required: true,
}

const QuizzesPage = () => {
    const [questions, setQuestions] = useState<Question[]>([])
    const [newQuestion, setNewQuestion] = useState<Question>({
        id: "",
        title: "",
        description: "",
        question_type: "text",
        category: "general",
        required: true,
    })
    const [search, setSearch] = useState("")
    const [textOptions, setTextOptions] = useState("")
    const [isOpenDialog, setIsOpenDialog] = useState(false)
    const [filterCategory, setFilterCategory] = useState<string>("todas")
    const [idleForm, setIdleForm] = useState<"create" | "editar">("create")
    const [filterQuestionType, setFilterQuestionType] = useState<string>("todos")
    const [errores, setErrores] = useState({} as Record<keyof Question, string>)

    const preguntasFiltradas = questions.filter(({ title, description, category, question_type }) => {
        const coincideBusqueda =
            title.toLowerCase().includes(search.toLowerCase()) || description?.toLowerCase().includes(search.toLowerCase())
        const coincideCategoria = filterCategory === "todas" || category === filterCategory
        const coincideTipo = filterQuestionType === "todos" || question_type === filterQuestionType
        return coincideBusqueda && coincideCategoria && coincideTipo
    })

    const handleCreateQuestion = () => {
        setNewQuestion({
            ...initialState,
            id: `p${Date.now()}`,
        })
        setTextOptions("")
        setIdleForm("create")
        setIsOpenDialog(true)
        setErrores({} as Record<keyof Question, string>)
    }

    const handleEditQuestion = (id: string) => {
        const pregunta = questions.find((p) => p.id === id)
        if (pregunta) {
            setTextOptions(pregunta.options?.join("\n") || "")
            setIsOpenDialog(true)
            setIdleForm("editar")
            setNewQuestion({ ...pregunta })
            setErrores({} as Record<keyof Question, string>)
        }
    }

    const isValidForm = (): boolean => {
        const nuevosErrores: Record<string, string> = {}

        if (!newQuestion.title.trim()) {
            nuevosErrores.title = "El título de la pregunta es obligatorio"
        }

        if (newQuestion.question_type === "single_choice" || newQuestion.question_type === "multiple_choice") {
            const opciones = textOptions
                .split("\n")
                .map((opcion) => opcion.trim())
                .filter((opcion) => opcion !== "")

            if (opciones.length < 2) {
                nuevosErrores.opciones = "Debe proporcionar al menos 2 opciones"
            }
        }

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const handleAddNewQuestion = () => {
        if (!isValidForm()) {
            return false
        }
        const finalQuestion = { ...newQuestion }
        if (finalQuestion.question_type === "single_choice" || finalQuestion.question_type === "multiple_choice") {
            const options = textOptions
                .split("\n")
                .map((option) => option.trim())
                .filter((option) => option !== "")

            finalQuestion.options = options
        }

        if (idleForm === "create") {
            addQuestion(finalQuestion)
            setQuestions((previous) => [...previous, finalQuestion])
        } else {
            updateQuestion(finalQuestion)
            setQuestions((previous) => previous.map((q) => (q.id === finalQuestion.id ? finalQuestion : q)))
        }
        setIsOpenDialog(false)
        return true
    }

    const handleDeleteQuestion = (id: string) => {
        deleteQuestion(id)
        setQuestions((previous) => previous.filter((question) => question.id !== id))
    }

    const handleUpdateField = (field: keyof Question, valor: any) => {
        setNewQuestion((previous) => {
            const nuevaPregunta = { ...previous, [field]: valor }
            if (field === "question_type") {
                if (valor === "single_choice" || valor === "multiple_choice") {
                    if (!previous.options || previous.options.length === 0) {
                        setTextOptions("")
                    }
                }
            }
            return nuevaPregunta
        })

        if (errores[field]) {
            setErrores((previous) => {
                const nuevosErrores = { ...previous }
                delete nuevosErrores[field]
                return nuevosErrores
            })
        }
    }

    useEffect(() => {
        const fetchQuestions = async () => {
            const questions = await getQuestions()
            setQuestions(questions)
        }
        fetchQuestions()
    }, [])

    return (
        <section>
            <div className="container mx-auto py-6">
                <h1 className="mb-6 text-3xl font-bold">Gestión de Preguntas</h1>
                <div className="mb-6 space-y-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="grid gap-4 md:grid-cols-4">
                                <div className="md:col-span-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Buscar preguntas..."
                                            className="pl-8"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Categoría" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todas">Todas las categorías</SelectItem>
                                            <SelectItem value="Personal">Personal</SelectItem>
                                            <SelectItem value="General">General</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Select value={filterQuestionType} onValueChange={setFilterQuestionType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tipo de pregunta" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todos">Todos los tipos</SelectItem>
                                            <SelectItem value="text">Respuesta de texto</SelectItem>
                                            <SelectItem value="single_choice">Selección única</SelectItem>
                                            <SelectItem value="multiple_choice">Selección múltiple</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Lista de Preguntas</h2>
                    <Dialog open={isOpenDialog} onOpenChange={setIsOpenDialog}>
                        <DialogTrigger asChild>
                            <Button onClick={handleCreateQuestion}>
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva Pregunta
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>{idleForm === "create" ? "Crear Nueva Pregunta" : "Editar Pregunta"}</DialogTitle>
                                <DialogDescription>
                                    Complete el formulario para{" "}
                                    {idleForm === "create" ? "crear una nueva pregunta" : "actualizar la pregunta"}.
                                </DialogDescription>
                            </DialogHeader>

                            {Object.keys(errores).length > 0 && (
                                <Alert variant="destructive" className="mt-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>Por favor corrija los errores antes de continuar.</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="flex items-center">
                                        Título de la pregunta <span className="text-red-500 ml-1">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        value={newQuestion.title}
                                        onChange={(e) => handleUpdateField("title", e.target.value)}
                                        placeholder="¿Cómo calificaría...?"
                                        className={errores.title ? "border-red-500" : ""}
                                    />
                                    {errores.title && <p className="text-sm text-red-500">{errores.title}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Descripción (opcional)</Label>
                                    <Textarea
                                        id="description"
                                        value={newQuestion.description}
                                        onChange={(e) => handleUpdateField("description", e.target.value)}
                                        placeholder="Proporcione más contexto sobre la pregunta..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Categoría</Label>
                                        <Select
                                            value={newQuestion.category}
                                            onValueChange={(valor) => handleUpdateField("category", valor)}
                                        >
                                            <SelectTrigger id="category">
                                                <SelectValue placeholder="Seleccionar categoría" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="General">General</SelectItem>
                                                <SelectItem value="Personal">Personal</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="question_type">Tipo de pregunta</Label>
                                        <Select
                                            value={newQuestion.question_type}
                                            onValueChange={(valor) => handleUpdateField("question_type", valor)}
                                        >
                                            <SelectTrigger id="question_type">
                                                <SelectValue placeholder="Seleccionar tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Respuesta de texto</SelectItem>
                                                <SelectItem value="single_choice">Selección única</SelectItem>
                                                <SelectItem value="multiple_choice">Selección múltiple</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="required"
                                        checked={newQuestion.required}
                                        onCheckedChange={(checked) => handleUpdateField("required", !!checked)}
                                    />
                                    <Label htmlFor="required" className="font-normal">
                                        Pregunta obligatoria
                                    </Label>
                                </div>

                                {(newQuestion.question_type === "single_choice" ||
                                    newQuestion.question_type === "multiple_choice") && (
                                    <div className="space-y-2">
                                        <Label htmlFor="opciones" className="flex items-center">
                                            Opciones (una por línea) <span className="text-red-500 ml-1">*</span>
                                        </Label>
                                        <Textarea
                                            id="opciones"
                                            value={textOptions}
                                            onChange={(e) => setTextOptions(e.target.value)}
                                            placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                                            className={`min-h-[100px] ${errores.options ? "border-red-500" : ""}`}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Ingrese al menos 2 opciones, una por línea.
                                        </p>
                                        {errores.options && <p className="text-sm text-red-500">{errores.options}</p>}
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsOpenDialog(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleAddNewQuestion}>
                                    {idleForm === "create" ? "Crear Pregunta" : "Guardar Cambios"}
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
                                    <TableHead className="w-[40%]">Pregunta</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {preguntasFiltradas.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No se encontraron preguntas que coincidan con los criterios de búsqueda.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    preguntasFiltradas.map(
                                        ({ id, title, description, question_type, category, required, options }) => (
                                            <TableRow key={id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{title}</p>
                                                        {description && (
                                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                                {description}
                                                            </p>
                                                        )}
                                                        {(question_type === "single_choice" ||
                                                            question_type === "multiple_choice") &&
                                                            options && (
                                                                <div className="mt-1 flex flex-wrap gap-1">
                                                                    {options.slice(0, 3).map((opcion, index) => (
                                                                        <Badge key={index} variant="outline" className="text-xs">
                                                                            {opcion}
                                                                        </Badge>
                                                                    ))}
                                                                    {options.length > 3 && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            +{options.length - 3} más
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{categories[category]}</TableCell>
                                                <TableCell>{questionTypes[question_type]}</TableCell>
                                                <TableCell>
                                                    <Badge variant={required ? "default" : "secondary"}>
                                                        {required ? "Obligatoria" : "Opcional"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEditQuestion(id)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                            <span className="sr-only">Editar</span>
                                                        </Button>

                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                    <span className="sr-only">Eliminar</span>
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>
                                                                        ¿Está seguro de eliminar esta pregunta?
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Esta acción no se puede deshacer. La pregunta se eliminará
                                                                        permanentemente del sistema.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDeleteQuestion(id)}
                                                                        className="bg-red-600 hover:bg-red-700"
                                                                    >
                                                                        Eliminar
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}

export default QuizzesPage
