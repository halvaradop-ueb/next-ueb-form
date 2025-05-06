"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Pencil, Trash2, Save } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Tipo para categorías
interface Categoria {
    id: string
    nombre: string
    descripcion: string
    slug: string
    preguntasAsociadas: number
    tipo: "estudiante" | "profesor" // Nuevo campo para indicar a quién va dirigida la categoría
}

export default function GestionCategoriasPage() {
    // Estado para las categorías
    const [categorias, setCategorias] = useState<Categoria[]>([
        {
            id: "cat1",
            nombre: "Profesor",
            descripcion: "Preguntas relacionadas con el desempeño del profesor",
            slug: "profesor",
            preguntasAsociadas: 12,
            tipo: "estudiante", // Esta categoría es para que los estudiantes evalúen a los profesores
        },
        {
            id: "cat2",
            nombre: "Curso",
            descripcion: "Preguntas sobre el contenido y estructura del curso",
            slug: "curso",
            preguntasAsociadas: 8,
            tipo: "estudiante", // Esta categoría es para que los estudiantes evalúen el curso
        },
        {
            id: "cat3",
            nombre: "Metodología",
            descripcion: "Preguntas sobre los métodos de enseñanza utilizados",
            slug: "metodologia",
            preguntasAsociadas: 6,
            tipo: "estudiante", // Esta categoría es para que los estudiantes evalúen la metodología
        },
        {
            id: "cat4",
            nombre: "Evaluación",
            descripcion: "Preguntas sobre los métodos de evaluación del curso",
            slug: "evaluacion",
            preguntasAsociadas: 5,
            tipo: "profesor", // Esta categoría es para que los profesores evalúen sus métodos de evaluación
        },
        {
            id: "cat5",
            nombre: "General",
            descripcion: "Preguntas generales sobre la experiencia educativa",
            slug: "general",
            preguntasAsociadas: 3,
            tipo: "estudiante", // Esta categoría es para estudiantes
        },
    ])

    // Estado para búsqueda
    const [busqueda, setBusqueda] = useState("")

    // Estado para la categoría que se está editando o creando
    const [categoriaActual, setCategoriaActual] = useState<Categoria>({
        id: "",
        nombre: "",
        descripcion: "",
        slug: "",
        preguntasAsociadas: 0,
        tipo: "estudiante", // Por defecto, las nuevas categorías son para estudiantes
    })

    // Estado para el modo del formulario (crear o editar)
    const [modoFormulario, setModoFormulario] = useState<"crear" | "editar">("crear")

    // Estado para controlar si el diálogo está abierto
    const [dialogoAbierto, setDialogoAbierto] = useState(false)

    // Estado para errores de validación
    const [errores, setErrores] = useState<{ [key: string]: string }>({})

    // Filtrar categorías según la búsqueda
    const categoriasFiltradas = categorias.filter(
        (categoria) =>
            categoria.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            categoria.descripcion.toLowerCase().includes(busqueda.toLowerCase()),
    )

    // Función para iniciar la creación de una nueva categoría
    const iniciarCrearCategoria = () => {
        setCategoriaActual({
            id: `cat${Date.now()}`,
            nombre: "",
            descripcion: "",
            slug: "",
            preguntasAsociadas: 0,
            tipo: "estudiante", // Por defecto, las nuevas categorías son para estudiantes
        })
        setModoFormulario("crear")
        setErrores({})
        setDialogoAbierto(true)
    }

    // Función para iniciar la edición de una categoría existente
    const iniciarEditarCategoria = (id: string) => {
        const categoria = categorias.find((c) => c.id === id)
        if (categoria) {
            setCategoriaActual({ ...categoria })
            setModoFormulario("editar")
            setErrores({})
            setDialogoAbierto(true)
        }
    }

    // Función para generar un slug a partir del nombre
    const generarSlug = (nombre: string): string => {
        return nombre
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, "-")
    }

    // Función para actualizar el slug cuando cambia el nombre
    const actualizarSlug = (nombre: string) => {
        const nuevoSlug = generarSlug(nombre)
        setCategoriaActual((prev) => ({
            ...prev,
            slug: nuevoSlug,
        }))
    }

    // Añadir estado para el texto de confirmación de eliminación
    const [textoConfirmacion, setTextoConfirmacion] = useState("")
    const [categoriaAEliminar, setCategoriaAEliminar] = useState<string | null>(null)
    const [dialogoEliminarAbierto, setDialogoEliminarAbierto] = useState(false)

    // Función para iniciar el proceso de eliminación
    const iniciarEliminarCategoria = (id: string) => {
        const categoria = categorias.find((c) => c.id === id)
        if (categoria && categoria.preguntasAsociadas === 0) {
            setCategoriaAEliminar(id)
            setTextoConfirmacion("")
            setDialogoEliminarAbierto(true)
        }
    }

    // Función para confirmar la eliminación
    const confirmarEliminarCategoria = () => {
        if (categoriaAEliminar && textoConfirmacion.toLowerCase() === "eliminar") {
            eliminarCategoria(categoriaAEliminar)
            setDialogoEliminarAbierto(false)
            setCategoriaAEliminar(null)
            setTextoConfirmacion("")
        }
    }

    // Validar el formulario de categoría
    const validarFormulario = (): boolean => {
        const nuevosErrores: { [key: string]: string } = {}

        // Validar nombre
        if (!categoriaActual.nombre.trim()) {
            nuevosErrores.nombre = "El nombre de la categoría es obligatorio"
        }

        // Validar slug
        if (!categoriaActual.slug.trim()) {
            nuevosErrores.slug = "El slug es obligatorio"
        } else if (!/^[a-z0-9-]+$/.test(categoriaActual.slug)) {
            nuevosErrores.slug = "El slug solo puede contener letras minúsculas, números y guiones"
        }

        // Validar tipo
        if (!categoriaActual.tipo) {
            nuevosErrores.tipo = "Debe seleccionar para quién es la categoría"
        }

        // Verificar que el slug no esté duplicado (excepto para la misma categoría en modo edición)
        const slugExistente = categorias.find(
            (c) => c.slug === categoriaActual.slug && (modoFormulario === "crear" || c.id !== categoriaActual.id),
        )
        if (slugExistente) {
            nuevosErrores.slug = "Este slug ya está en uso por otra categoría"
        }

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    // Función para guardar una categoría (crear o actualizar)
    const guardarCategoria = () => {
        // Validar el formulario
        if (!validarFormulario()) {
            return false
        }

        if (modoFormulario === "crear") {
            // Agregar nueva categoría
            setCategorias([...categorias, categoriaActual])
        } else {
            // Actualizar categoría existente
            setCategorias(categorias.map((c) => (c.id === categoriaActual.id ? categoriaActual : c)))
        }

        setDialogoAbierto(false)
        return true
    }

    // Función para eliminar una categoría
    const eliminarCategoria = (id: string) => {
        setCategorias(categorias.filter((c) => c.id !== id))
    }

    // Función para actualizar campos de la categoría actual
    const actualizarCampoCategoria = (campo: keyof Categoria, valor: any) => {
        setCategoriaActual((prev) => ({
            ...prev,
            [campo]: valor,
        }))

        // Si se actualiza el nombre, actualizar también el slug (solo en modo crear o si el slug no ha sido editado manualmente)
        if (campo === "nombre" && (modoFormulario === "crear" || categoriaActual.slug === generarSlug(categoriaActual.nombre))) {
            actualizarSlug(valor)
        }

        // Limpiar errores relacionados con el campo actualizado
        if (errores[campo as string]) {
            setErrores((prev) => {
                const nuevosErrores = { ...prev }
                delete nuevosErrores[campo as string]
                return nuevosErrores
            })
        }
    }

    return (
        <section>
            <div className="container mx-auto py-6">
                <h1 className="mb-6 text-3xl font-bold">Gestión de Categorías</h1>

                <div className="mb-6 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar categorías..."
                            className="pl-8"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                    <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
                        <DialogTrigger asChild>
                            <Button onClick={iniciarCrearCategoria}>
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva Categoría
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>
                                    {modoFormulario === "crear" ? "Crear Nueva Categoría" : "Editar Categoría"}
                                </DialogTitle>
                                <DialogDescription>
                                    {modoFormulario === "crear"
                                        ? "Crea una nueva categoría para clasificar preguntas."
                                        : "Modifica los detalles de la categoría."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nombre" className="flex items-center">
                                        Nombre <span className="text-red-500 ml-1">*</span>
                                    </Label>
                                    <Input
                                        id="nombre"
                                        value={categoriaActual.nombre}
                                        onChange={(e) => actualizarCampoCategoria("nombre", e.target.value)}
                                        placeholder="Ej: Metodología de enseñanza"
                                        className={errores.nombre ? "border-red-500" : ""}
                                    />
                                    {errores.nombre && <p className="text-sm text-red-500">{errores.nombre}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="descripcion">Descripción</Label>
                                    <Textarea
                                        id="descripcion"
                                        value={categoriaActual.descripcion}
                                        onChange={(e) => actualizarCampoCategoria("descripcion", e.target.value)}
                                        placeholder="Describe el propósito de esta categoría..."
                                        className="min-h-[80px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slug" className="flex items-center">
                                        Slug <span className="text-red-500 ml-1">*</span>
                                    </Label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            id="slug"
                                            value={categoriaActual.slug}
                                            onChange={(e) => actualizarCampoCategoria("slug", e.target.value)}
                                            placeholder="ej-metodologia-ensenanza"
                                            className={errores.slug ? "border-red-500" : ""}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => actualizarSlug(categoriaActual.nombre)}
                                        >
                                            <Save className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Identificador único para la categoría. Solo letras minúsculas, números y guiones.
                                    </p>
                                    {errores.slug && <p className="text-sm text-red-500">{errores.slug}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tipo" className="flex items-center">
                                        Tipo de categoría <span className="text-red-500 ml-1">*</span>
                                    </Label>
                                    <Select
                                        value={categoriaActual.tipo}
                                        onValueChange={(valor) => actualizarCampoCategoria("tipo", valor)}
                                    >
                                        <SelectTrigger id="tipo" className={errores.tipo ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Seleccionar tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="estudiante">Para Estudiantes</SelectItem>
                                            <SelectItem value="profesor">Para Profesores</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Indica si esta categoría de preguntas será respondida por estudiantes o profesores.
                                    </p>
                                    {errores.tipo && <p className="text-sm text-red-500">{errores.tipo}</p>}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogoAbierto(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={guardarCategoria}>
                                    {modoFormulario === "crear" ? "Crear Categoría" : "Guardar Cambios"}
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
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Preguntas</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categoriasFiltradas.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No se encontraron categorías que coincidan con la búsqueda.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    categoriasFiltradas.map((categoria) => (
                                        <TableRow key={categoria.id}>
                                            <TableCell className="font-medium">{categoria.nombre}</TableCell>
                                            <TableCell className="max-w-xs truncate">{categoria.descripcion}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{categoria.slug}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={categoria.tipo === "estudiante" ? "default" : "secondary"}>
                                                    {categoria.tipo === "estudiante" ? "Estudiante" : "Profesor"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{categoria.preguntasAsociadas}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => iniciarEditarCategoria(categoria.id)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        <span className="sr-only">Editar</span>
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={categoria.preguntasAsociadas > 0}
                                                        title={
                                                            categoria.preguntasAsociadas > 0
                                                                ? "No se puede eliminar una categoría con preguntas asociadas"
                                                                : "Eliminar categoría"
                                                        }
                                                        onClick={() => iniciarEliminarCategoria(categoria.id)}
                                                    >
                                                        <Trash2
                                                            className={`h-4 w-4 ${
                                                                categoria.preguntasAsociadas > 0
                                                                    ? "text-gray-400"
                                                                    : "text-red-500"
                                                            }`}
                                                        />
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
            <Dialog open={dialogoEliminarAbierto} onOpenChange={setDialogoEliminarAbierto}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Confirmar eliminación de categoría</DialogTitle>
                        <DialogDescription>
                            <div className="space-y-4 pt-2">
                                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
                                    <p className="font-medium">¡Atención! Esta acción no se puede deshacer.</p>
                                    <p className="mt-1">
                                        Está a punto de eliminar permanentemente una categoría del sistema. Esta acción:
                                    </p>
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        <li>Eliminará la categoría de forma permanente</li>
                                        <li>Podría afectar a la organización de las preguntas</li>
                                        <li>Podría impactar en reportes históricos</li>
                                    </ul>
                                </div>

                                <p>
                                    Para confirmar que desea eliminar esta categoría, escriba{" "}
                                    <span className="font-bold">eliminar</span> en el campo a continuación:
                                </p>

                                <Input
                                    value={textoConfirmacion}
                                    onChange={(e) => setTextoConfirmacion(e.target.value)}
                                    placeholder="Escriba 'eliminar' para confirmar"
                                    className="mt-2"
                                />
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDialogoEliminarAbierto(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmarEliminarCategoria}
                            disabled={textoConfirmacion.toLowerCase() !== "eliminar"}
                        >
                            Eliminar Categoría
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}
