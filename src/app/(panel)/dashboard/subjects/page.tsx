"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Pencil, Trash2, UserPlus, UserMinus, ChevronDown, ChevronRight, BookOpen, User } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { addAssignment, getProfessorsBySubject, getSubjects, getSubjectsByProfessorId } from "@/services/subjects"
import { ProfessorService, SubjectAssignmentWithProfessorService, SubjectService } from "@/lib/@types/services"
import { getProfessors } from "@/services/professors"
import { supabase } from "@/lib/supabase/client"

interface Profesor {
    id: string
    nombre: string
    email: string
    departamento: string
}

interface Materia {
    id: string
    codigo: string
    nombre: string
    descripcion: string
    departamento: string
    creditos: number
    activa: boolean
}

interface AsignacionProfesor {
    id: string
    materiaId: string
    profesorId: string
}

const SubjectsPage = () => {
    const [subjects, setSubjects] = useState<SubjectService[]>([])
    const [professors, setProfessors] = useState<ProfessorService[]>([])
    const [assignments, setAssignments] = useState<SubjectAssignmentWithProfessorService[]>([])

    const [activeTab, setActiveTab] = useState("materias")

    // Estado para materias
    const [materias, setMaterias] = useState<Materia[]>([
        {
            id: "mat1",
            codigo: "CS101",
            nombre: "Introducción a la Programación",
            descripcion: "Fundamentos de programación y algoritmos",
            departamento: "Ciencias de la Computación",
            creditos: 4,
            activa: true,
        },
        {
            id: "mat2",
            codigo: "CS201",
            nombre: "Estructuras de Datos",
            descripcion: "Estudio de estructuras de datos y algoritmos avanzados",
            departamento: "Ciencias de la Computación",
            creditos: 4,
            activa: true,
        },
        {
            id: "mat3",
            codigo: "MATH101",
            nombre: "Cálculo I",
            descripcion: "Introducción al cálculo diferencial e integral",
            departamento: "Matemáticas",
            creditos: 5,
            activa: true,
        },
        {
            id: "mat4",
            codigo: "PHYS101",
            nombre: "Física General",
            descripcion: "Principios fundamentales de la física",
            departamento: "Física",
            creditos: 4,
            activa: true,
        },
        {
            id: "mat5",
            codigo: "ENG101",
            nombre: "Comunicación Escrita",
            descripcion: "Desarrollo de habilidades de escritura académica",
            departamento: "Humanidades",
            creditos: 3,
            activa: false,
        },
    ])

    // Estado para profesores
    const [profesores, setProfesores] = useState<Profesor[]>([
        {
            id: "prof1",
            nombre: "Dr. Smith",
            email: "smith@universidad.edu",
            departamento: "Ciencias de la Computación",
        },
        {
            id: "prof2",
            nombre: "Dra. Johnson",
            email: "johnson@universidad.edu",
            departamento: "Matemáticas",
        },
        {
            id: "prof3",
            nombre: "Dr. Williams",
            email: "williams@universidad.edu",
            departamento: "Física",
        },
        {
            id: "prof4",
            nombre: "Dr. Brown",
            email: "brown@universidad.edu",
            departamento: "Ciencias de la Computación",
        },
        {
            id: "prof5",
            nombre: "Dra. Davis",
            email: "davis@universidad.edu",
            departamento: "Humanidades",
        },
    ])

    // Estado para asignaciones de profesores a materias
    const [asignaciones, setAsignaciones] = useState<AsignacionProfesor[]>([
        {
            id: "asig1",
            materiaId: "mat1",
            profesorId: "prof1",
        },
        {
            id: "asig2",
            materiaId: "mat1",
            profesorId: "prof4",
        },
        {
            id: "asig3",
            materiaId: "mat2",
            profesorId: "prof1",
        },
        {
            id: "asig4",
            materiaId: "mat3",
            profesorId: "prof2",
        },
        {
            id: "asig5",
            materiaId: "mat4",
            profesorId: "prof3",
        },
    ])

    // Estado para búsqueda
    const [search, setSearch] = useState("")
    const [busquedaProfesor, setBusquedaProfesor] = useState("")

    // Estado para la materia que se está editando o creando
    const [materiaActual, setMateriaActual] = useState<Materia>({
        id: "",
        codigo: "",
        nombre: "",
        descripcion: "",
        departamento: "",
        creditos: 3,
        activa: true,
    })

    // Estado para la asignación que se está creando
    const [assignment, setAsignacionActual] = useState<AsignacionProfesor>({
        id: "",
        materiaId: "",
        profesorId: "",
    })

    // Estado para el modo del formulario (crear o editar)
    const [modoFormulario, setModoFormulario] = useState<"crear" | "editar">("crear")

    // Estado para controlar si los diálogos están abiertos
    const [dialogoMateriaAbierto, setDialogoMateriaAbierto] = useState(false)
    const [dialogoAsignacionAbierto, setDialogoAsignacionAbierto] = useState(false)

    // Estado para errores de validación
    const [errores, setErrores] = useState<{ [key: string]: string }>({})

    // Estado para materias expandidas (para mostrar profesores asignados)
    const [materiasExpandidas, setMateriasExpandidas] = useState<string[]>([])

    // Filtrar materias según la búsqueda y departamento
    const materiasFiltradas = subjects.filter(
        (subjects) =>
            subjects.name.toLowerCase().includes(search.toLowerCase()) ||
            subjects.description.toLowerCase().includes(search.toLowerCase()),
    )

    // Función para iniciar la creación de una nueva materia
    const iniciarCrearMateria = () => {
        setMateriaActual({
            id: `mat${Date.now()}`,
            codigo: "",
            nombre: "",
            descripcion: "",
            departamento: "",
            creditos: 3,
            activa: true,
        })
        setModoFormulario("crear")
        setErrores({})
        setDialogoMateriaAbierto(true)
    }

    // Función para iniciar la edición de una materia existente
    const iniciarEditarMateria = (id: string) => {
        const materia = materias.find((m) => m.id === id)
        if (materia) {
            setMateriaActual({ ...materia })
            setModoFormulario("editar")
            setErrores({})
            setDialogoMateriaAbierto(true)
        }
    }

    // Función para iniciar la asignación de un profesor a una materia
    const iniciarAsignarProfesor = (materiaId: string) => {
        setAsignacionActual({
            id: `asig${Date.now()}`,
            materiaId,
            profesorId: "",
        })
        setErrores({})
        setDialogoAsignacionAbierto(true)
    }

    // Función para iniciar la creación de una asignación desde cero
    const iniciarCrearAsignacion = () => {
        setAsignacionActual({
            id: `asig${Date.now()}`,
            materiaId: "",
            profesorId: "",
        })
        setErrores({})
        setDialogoAsignacionAbierto(true)
    }

    // Validar el formulario de materia
    const validarFormularioMateria = (): boolean => {
        const nuevosErrores: { [key: string]: string } = {}

        // Validar código
        if (!materiaActual.codigo.trim()) {
            nuevosErrores.codigo = "El código de la materia es obligatorio"
        }

        // Validar nombre
        if (!materiaActual.nombre.trim()) {
            nuevosErrores.nombre = "El nombre de la materia es obligatorio"
        }

        // Validar departamento
        if (!materiaActual.departamento) {
            nuevosErrores.departamento = "El departamento es obligatorio"
        }

        // Validar créditos
        if (materiaActual.creditos < 1 || materiaActual.creditos > 10) {
            nuevosErrores.creditos = "Los créditos deben estar entre 1 y 10"
        }

        // Verificar que el código no esté duplicado (excepto para la misma materia en modo edición)
        const codigoExistente = materias.find(
            (m) => m.codigo === materiaActual.codigo && (modoFormulario === "crear" || m.id !== materiaActual.id),
        )
        if (codigoExistente) {
            nuevosErrores.codigo = "Este código ya está en uso por otra materia"
        }

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    // Validar el formulario de asignación
    const validarFormularioAsignacion = (): boolean => {
        const nuevosErrores: { [key: string]: string } = {}

        if (!assignment.materiaId) {
            nuevosErrores.materiaId = "Debe seleccionar una materia"
        }

        if (!assignment.profesorId) {
            nuevosErrores.profesorId = "Debe seleccionar un profesor"
        }
        const asignacionExistente = asignaciones.find(
            (a) => a.materiaId === assignment.materiaId && a.profesorId === assignment.profesorId,
        )
        if (asignacionExistente) {
            nuevosErrores.general = "Ya existe una asignación con estos datos"
        }

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    // Función para guardar una materia (crear o actualizar)
    const guardarMateria = () => {
        // Validar el formulario
        if (!validarFormularioMateria()) {
            return false
        }

        if (modoFormulario === "crear") {
            // Agregar nueva materia
            setMaterias([...materias, materiaActual])
        } else {
            // Actualizar materia existente
            setMaterias(materias.map((m) => (m.id === materiaActual.id ? materiaActual : m)))
        }

        setDialogoMateriaAbierto(false)
        return true
    }

    // Función para guardar una asignación
    const guardarAsignacion = async () => {
        // Validar el formulario
        if (!validarFormularioAsignacion()) {
            return false
        }

        const newAssignment = await addAssignment(assignment.profesorId, assignment.materiaId)
        console.log("Asignación guardada:", assignment, ", newAssignment:", newAssignment)
        setAsignaciones([...asignaciones, assignment])
        setDialogoAsignacionAbierto(false)

        // Expandir la materia para mostrar la nueva asignación
        if (!materiasExpandidas.includes(assignment.materiaId)) {
            setMateriasExpandidas([...materiasExpandidas, assignment.materiaId])
        }

        return true
    }

    // Función para eliminar una materia
    const eliminarMateria = (id: string) => {
        // Eliminar también todas las asignaciones asociadas
        setAsignaciones(asignaciones.filter((a) => a.materiaId !== id))
        setMaterias(materias.filter((m) => m.id !== id))
    }

    // Función para eliminar una asignación
    const eliminarAsignacion = (id: string) => {
        setAsignaciones(asignaciones.filter((a) => a.id !== id))
    }

    // Función para actualizar campos de la materia actual
    const actualizarCampoMateria = (campo: keyof Materia, valor: any) => {
        setMateriaActual((prev) => ({
            ...prev,
            [campo]: valor,
        }))

        // Limpiar errores relacionados con el campo actualizado
        if (errores[campo as string]) {
            setErrores((prev) => {
                const nuevosErrores = { ...prev }
                delete nuevosErrores[campo as string]
                return nuevosErrores
            })
        }
    }

    // Función para actualizar campos de la asignación actual
    const actualizarCampoAsignacion = (campo: keyof AsignacionProfesor, valor: any) => {
        setAsignacionActual((prev) => ({
            ...prev,
            [campo]: valor,
        }))

        // Limpiar errores relacionados con el campo actualizado
        if (errores[campo as string]) {
            setErrores((prev) => {
                const nuevosErrores = { ...prev }
                delete nuevosErrores[campo as string]
                return nuevosErrores
            })
        }
    }

    // Función para alternar la expansión de una materia
    const toggleExpansionMateria = (id: string) => {
        if (materiasExpandidas.includes(id)) {
            setMateriasExpandidas(materiasExpandidas.filter((materiaId) => materiaId !== id))
        } else {
            setMateriasExpandidas([...materiasExpandidas, id])
        }
    }

    // Obtener profesores asignados a una materia
    const getProfesoresAsignados = (materiaId: string) => {
        return asignaciones
            .filter((a) => a.materiaId === materiaId)
            .map((asignacion) => {
                const profesor = profesores.find((p) => p.id === asignacion.profesorId)
                return {
                    ...asignacion,
                    nombreProfesor: profesor ? profesor.nombre : "Profesor desconocido",
                }
            })
    }

    // Obtener nombre de materia por ID
    const getNombreMateria = (id: string) => {
        const materia = materias.find((m) => m.id === id)
        return materia ? materia.nombre : "Materia desconocida"
    }

    // Obtener nombre de profesor por ID
    const getNombreProfesor = (id: string) => {
        const profesor = profesores.find((p) => p.id === id)
        return profesor ? profesor.nombre : "Profesor desconocido"
    }

    useEffect(() => {
        const fetchSubjects = async () => {
            const [subjects, professors] = await Promise.all([getSubjects(), getProfessors()])
            setSubjects(subjects)
            setProfessors(professors)
            const fetchAssignments = async () => {
                const allAssignments = await Promise.all(subjects.map((subject) => getProfessorsBySubject(subject.id)))
                setAssignments(allAssignments.flat())
            }
            fetchAssignments()
        }
        fetchSubjects()
    }, [])

    return (
        <section>
            <div className="container mx-auto py-6">
                <h1 className="mb-6 text-3xl font-bold">Gestión de Materias y Profesores</h1>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="materias">Materias</TabsTrigger>
                        <TabsTrigger value="asignaciones">Asignaciones</TabsTrigger>
                    </TabsList>

                    <TabsContent value="materias" className="space-y-6 pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="relative w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Buscar materias..."
                                        className="pl-8"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Dialog open={dialogoMateriaAbierto} onOpenChange={setDialogoMateriaAbierto}>
                                <DialogTrigger asChild>
                                    <Button onClick={iniciarCrearMateria}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Nueva Materia
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px]">
                                    <DialogHeader>
                                        <DialogTitle>
                                            {modoFormulario === "crear" ? "Crear Nueva Materia" : "Editar Materia"}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {modoFormulario === "crear"
                                                ? "Crea una nueva materia en el sistema."
                                                : "Modifica los detalles de la materia."}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="nombre" className="flex items-center">
                                                Nombre <span className="text-red-500 ml-1">*</span>
                                            </Label>
                                            <Input
                                                id="nombre"
                                                value={materiaActual.nombre}
                                                onChange={(e) => actualizarCampoMateria("nombre", e.target.value)}
                                                placeholder="Ej: Introducción a la Programación"
                                                className={errores.nombre ? "border-red-500" : ""}
                                            />
                                            {errores.nombre && <p className="text-sm text-red-500">{errores.nombre}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="descripcion">Descripción</Label>
                                            <Textarea
                                                id="descripcion"
                                                value={materiaActual.descripcion}
                                                onChange={(e) => actualizarCampoMateria("descripcion", e.target.value)}
                                                placeholder="Describe el contenido de la materia..."
                                                className="min-h-[80px]"
                                            />
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="activa"
                                                checked={materiaActual.activa}
                                                onChange={(e) => actualizarCampoMateria("activa", e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <Label htmlFor="activa" className="font-normal">
                                                Materia activa
                                            </Label>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setDialogoMateriaAbierto(false)}>
                                            Cancelar
                                        </Button>
                                        <Button onClick={guardarMateria}>
                                            {modoFormulario === "crear" ? "Crear Materia" : "Guardar Cambios"}
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
                                            <TableHead className="w-[30px]"></TableHead>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {materiasFiltradas.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    No se encontraron materias que coincidan con la búsqueda.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            materiasFiltradas.map((subject) => {
                                                assignments.filter((assignment) => assignment.subject_id === subject.id)
                                                const profesoresAsignados = getProfesoresAsignados(subject.id)
                                                const isExpanded = materiasExpandidas.includes(subject.id)

                                                return (
                                                    <>
                                                        <TableRow key={subject.id} className={isExpanded ? "border-b-0" : ""}>
                                                            <TableCell>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => toggleExpansionMateria(subject.id)}
                                                                    className="h-6 w-6"
                                                                >
                                                                    {isExpanded ? (
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    ) : (
                                                                        <ChevronRight className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </TableCell>
                                                            <TableCell className="font-medium">{subject.name}</TableCell>
                                                            <TableCell>{subject.description}</TableCell>
                                                            <TableCell>
                                                                <Badge>Activa</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => iniciarAsignarProfesor(subject.id)}
                                                                        title="Asignar profesor"
                                                                    >
                                                                        <UserPlus className="h-4 w-4" />
                                                                        <span className="sr-only">Asignar profesor</span>
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => iniciarEditarMateria(subject.id)}
                                                                        title="Editar materia"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                        <span className="sr-only">Editar</span>
                                                                    </Button>
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                title="Eliminar materia"
                                                                            >
                                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                                                <span className="sr-only">Eliminar</span>
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>
                                                                                    ¿Está seguro de eliminar esta materia?
                                                                                </AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    Esta acción no se puede deshacer. La materia y
                                                                                    todas sus asignaciones se eliminarán
                                                                                    permanentemente.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    onClick={() => eliminarMateria(subject.id)}
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
                                                        {isExpanded && (
                                                            <TableRow>
                                                                <TableCell colSpan={7} className="bg-muted/30 p-0">
                                                                    <div className="p-4">
                                                                        <h4 className="text-sm font-medium mb-2">
                                                                            Profesores asignados
                                                                        </h4>
                                                                        {profesoresAsignados.length === 0 ? (
                                                                            <p className="text-sm text-muted-foreground">
                                                                                No hay profesores asignados a esta materia.
                                                                            </p>
                                                                        ) : (
                                                                            <div className="space-y-2">
                                                                                {profesoresAsignados.map((asignacion) => (
                                                                                    <div
                                                                                        key={asignacion.id}
                                                                                        className="flex items-center justify-between bg-background rounded-md p-2"
                                                                                    >
                                                                                        <div className="flex items-center gap-2">
                                                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                                                            <span className="font-medium">
                                                                                                {asignacion.nombreProfesor}
                                                                                            </span>
                                                                                        </div>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            onClick={() =>
                                                                                                eliminarAsignacion(asignacion.id)
                                                                                            }
                                                                                            title="Eliminar asignación"
                                                                                        >
                                                                                            <UserMinus className="h-4 w-4 text-red-500" />
                                                                                            <span className="sr-only">
                                                                                                Eliminar asignación
                                                                                            </span>
                                                                                        </Button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </>
                                                )
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="asignaciones" className="space-y-6 pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Buscar profesor..."
                                    className="pl-8"
                                    value={busquedaProfesor}
                                    onChange={(e) => setBusquedaProfesor(e.target.value)}
                                />
                            </div>

                            {/* Añadir botón para crear asignación */}
                            <Button onClick={() => iniciarCrearAsignacion()}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Nueva Asignación
                            </Button>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Asignaciones de Profesores a Materias</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {asignaciones.length === 0 ? (
                                        <p className="text-center text-muted-foreground">No hay asignaciones registradas.</p>
                                    ) : (
                                        asignaciones.map((asignacion) => (
                                            <Card key={asignacion.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                                <span className="font-medium">
                                                                    {getNombreMateria(asignacion.materiaId)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <User className="h-4 w-4 text-muted-foreground" />
                                                                <span>{getNombreProfesor(asignacion.profesorId)}</span>
                                                            </div>
                                                        </div>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" title="Eliminar asignación">
                                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                                    <span className="sr-only">Eliminar</span>
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>
                                                                        ¿Está seguro de eliminar esta asignación?
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Esta acción no se puede deshacer. La asignación se
                                                                        eliminará permanentemente.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => eliminarAsignacion(asignacion.id)}
                                                                        className="bg-red-600 hover:bg-red-700"
                                                                    >
                                                                        Eliminar
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Diálogo para asignar profesor a materia */}
                <Dialog open={dialogoAsignacionAbierto} onOpenChange={setDialogoAsignacionAbierto}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Asignar Profesor a Materia</DialogTitle>
                            <DialogDescription>
                                {assignment.materiaId ? (
                                    <>
                                        Asigna un profesor a la materia: <strong>{getNombreMateria(assignment.materiaId)}</strong>
                                    </>
                                ) : (
                                    <>Crea una nueva asignación de profesor a materia</>
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {errores.general && (
                                <div className="bg-red-50 p-2 rounded-md border border-red-200 text-red-600 text-sm">
                                    {errores.general}
                                </div>
                            )}

                            {/* Selector de materia (solo visible cuando se crea desde cero) */}
                            {!assignment.materiaId && (
                                <div className="space-y-2">
                                    <Label htmlFor="materiaId" className="flex items-center">
                                        Materia <span className="text-red-500 ml-1">*</span>
                                    </Label>
                                    <Select
                                        value={assignment.materiaId}
                                        onValueChange={(valor) => actualizarCampoAsignacion("materiaId", valor)}
                                    >
                                        <SelectTrigger id="materiaId" className={errores.materiaId ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Seleccionar materia" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {materias
                                                .filter((m) => m.activa) // Solo mostrar materias activas
                                                .map((materia) => (
                                                    <SelectItem key={materia.id} value={materia.id}>
                                                        {materia.codigo} - {materia.nombre}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    {errores.materiaId && <p className="text-sm text-red-500">{errores.materiaId}</p>}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="profesorId" className="flex items-center">
                                    Profesor <span className="text-red-500 ml-1">*</span>
                                </Label>
                                <Select
                                    value={assignment.profesorId}
                                    onValueChange={(valor) => actualizarCampoAsignacion("profesorId", valor)}
                                >
                                    <SelectTrigger id="profesorId" className={errores.profesorId ? "border-red-500" : ""}>
                                        <SelectValue placeholder="Seleccionar profesor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {professors.map(({ id, first_name, last_name }) => (
                                            <SelectItem key={id} value={id}>
                                                {first_name} {last_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errores.profesorId && <p className="text-sm text-red-500">{errores.profesorId}</p>}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogoAsignacionAbierto(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={guardarAsignacion}>Asignar Profesor</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </section>
    )
}

export default SubjectsPage
