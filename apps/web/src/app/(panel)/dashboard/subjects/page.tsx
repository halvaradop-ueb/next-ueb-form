"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Trash2, UserPlus, BookOpen, User } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmAction } from "@/ui/common/confirm-action"
import {
    addAssignment,
    addSubject,
    deleteAssignment,
    deleteSubject,
    getProfessorsBySubject,
    getSubjects,
} from "@/services/subjects"
import type { ProfessorService, SubjectAssignmentWithProfessorService, SubjectService } from "@/lib/@types/services"
import { getProfessors } from "@/services/professors"
import { SubjectAssignment } from "@/ui/subjects/subject-assignment"

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
    const [activeTab, setActiveTab] = useState("materias")
    const [subjects, setSubjects] = useState<SubjectService[]>([])
    const [professors, setProfessors] = useState<ProfessorService[]>([])
    const [assignments, setAssignments] = useState<SubjectAssignmentWithProfessorService[]>([])

    const [search, setSearch] = useState("")
    const [busquedaProfesor, setBusquedaProfesor] = useState("")

    const [materiaActual, setMateriaActual] = useState<Materia>({
        id: "",
        codigo: "",
        nombre: "",
        descripcion: "",
        departamento: "",
        creditos: 3,
        activa: true,
    })

    const [assignment, setAsignacionActual] = useState<AsignacionProfesor>({
        id: "",
        materiaId: "",
        profesorId: "",
    })

    const [modoFormulario, setModoFormulario] = useState<"crear" | "editar">("crear")

    const [dialogoMateriaAbierto, setDialogoMateriaAbierto] = useState(false)
    const [dialogoAsignacionAbierto, setDialogoAsignacionAbierto] = useState(false)

    const [errores, setErrores] = useState<{ [key: string]: string }>({})

    const [expandedSubjects, setExpandedSubjects] = useState<string[]>([])

    // ConfirmAction state for assignment deletion
    const [confirmDeleteAssignmentOpen, setConfirmDeleteAssignmentOpen] = useState(false)
    const [confirmDeleteAssignmentText, setConfirmDeleteAssignmentText] = useState("")
    const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null)

    const filteredSubjects = subjects.filter(
        (subjects) =>
            subjects.name.toLowerCase().includes(search.toLowerCase()) ||
            subjects.description.toLowerCase().includes(search.toLowerCase())
    )

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

    const handleEditSubject = (subjectId: string) => {
        const materia = subjects.find((subject) => subject.id === subjectId)
        if (materia) {
            //setMateriaActual({ ...materia })
            //setModoFormulario("editar")
            //setErrores({})
            //setDialogoMateriaAbierto(true)
        }
    }

    const handleCreateAssignment = (materiaId: string) => {
        setAsignacionActual({
            id: `asig${Date.now()}`,
            materiaId,
            profesorId: "",
        })
        setErrores({})
        setDialogoAsignacionAbierto(true)
    }

    /**
     * @deprecated
     */
    const iniciarCrearAsignacion = () => {
        setAsignacionActual({
            id: `asig${Date.now()}`,
            materiaId: "",
            profesorId: "",
        })
        setErrores({})
        setDialogoAsignacionAbierto(true)
    }

    const validarFormularioMateria = (): boolean => {
        const nuevosErrores: { [key: string]: string } = {}
        if (!materiaActual.nombre.trim()) {
            nuevosErrores.nombre = "El nombre de la materia es obligatorio"
        }
        const nombreExiste = subjects.some(
            (subject) => subject.name.trim().toLowerCase() === materiaActual.nombre.trim().toLowerCase()
        )

        if (modoFormulario === "crear" && nombreExiste) {
            nuevosErrores.nombre = "Ya existe una materia con ese nombre"
        }
        // TODO: Implement code validation logic
        // const codigoExistente = subjects.some((subject) => subject.code === materiaActual.codigo)
        // if (codigoExistente) {
        //     nuevosErrores.codigo = "Este código ya está en uso por otra materia"
        // }

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const validarFormularioAsignacion = (): boolean => {
        const nuevosErrores: { [key: string]: string } = {}

        if (!assignment.materiaId) {
            nuevosErrores.materiaId = "Debe seleccionar una materia"
        }

        if (!assignment.profesorId) {
            nuevosErrores.profesorId = "Debe seleccionar un profesor"
        }
        const asignacionExistente = assignments.find((a) => a.subject_id === assignment.materiaId && a.id === assignment.id)
        if (asignacionExistente) {
            nuevosErrores.general = "Ya existe una asignación con estos datos"
        }

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    const handleSaveSubject = async () => {
        if (!validarFormularioMateria()) {
            return false
        }
        if (modoFormulario === "crear") {
            const newSubject = await addSubject({
                name: materiaActual.nombre,
                description: materiaActual.descripcion,
            })
            setSubjects((previous) => [...previous, newSubject])
        } else {
            //setSubjects((previous) => previous.map((subject) => (subject.id === newSubject.id ? newSubject : subject)))
        }

        setDialogoMateriaAbierto(false)
        return true
    }

    const handleSaveAssignment = async () => {
        if (!validarFormularioAsignacion()) {
            return false
        }
        await addAssignment(assignment.profesorId, assignment.materiaId)
        /**
         * TODO: update this logic
         * HARD CODED
         */
        const subjects = await getSubjects()
        const allAssignments = await Promise.all(subjects.map((subject) => getProfessorsBySubject(subject.id)))
        setAssignments(allAssignments.flat())
        setDialogoAsignacionAbierto(false)
        if (!expandedSubjects.includes(assignment.materiaId)) {
            setExpandedSubjects([...expandedSubjects, assignment.materiaId])
        }
        return true
    }

    const handleDeleteSubject = async (subjectId: string) => {
        await deleteSubject(subjectId)
        setSubjects((previous) => previous.filter((subject) => subject.id !== subjectId))
        setAssignments((previous) => previous.filter((assignment) => assignment.subject_id !== subjectId))
    }

    const handleDeleteAssignment = async (assignmentId: string) => {
        await deleteAssignment(assignmentId)
        setAssignments((previous) => previous.filter((assignment) => assignment.id !== assignmentId))
    }

    const handleDeleteAssignmentRequest = (assignmentId: string) => {
        setAssignmentToDelete(assignmentId)
        setConfirmDeleteAssignmentOpen(true)
    }

    const confirmDeleteAssignment = async () => {
        if (assignmentToDelete) {
            await handleDeleteAssignment(assignmentToDelete)
            setAssignmentToDelete(null)
        }
    }

    const actualizarCampoMateria = (campo: keyof Materia, valor: any) => {
        setMateriaActual((prev) => ({
            ...prev,
            [campo]: valor,
        }))

        if (errores[campo as string]) {
            setErrores((prev) => {
                const nuevosErrores = { ...prev }
                delete nuevosErrores[campo as string]
                return nuevosErrores
            })
        }
    }

    const actualizarCampoAsignacion = (campo: keyof AsignacionProfesor, valor: any) => {
        setAsignacionActual((prev) => ({
            ...prev,
            [campo]: valor,
        }))

        if (errores[campo as string]) {
            setErrores((prev) => {
                const nuevosErrores = { ...prev }
                delete nuevosErrores[campo as string]
                return nuevosErrores
            })
        }
    }

    const handleToggleSubjectExpantion = (id: string) => {
        if (expandedSubjects.includes(id)) {
            setExpandedSubjects(expandedSubjects.filter((materiaId) => materiaId !== id))
        } else {
            setExpandedSubjects([...expandedSubjects, id])
        }
    }

    useEffect(() => {
        const fetchSubjects = async () => {
            const [subjects, professors] = await Promise.all([getSubjects(), getProfessors()])
            setSubjects(subjects)
            setProfessors(professors)
            const allAssignments = await Promise.all(subjects.map((subject) => getProfessorsBySubject(subject.id)))
            setAssignments(allAssignments.flat())
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
                                        <Button onClick={handleSaveSubject}>
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
                                        {filteredSubjects.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    No se encontraron materias que coincidan con la búsqueda.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredSubjects.map((subject) => {
                                                return (
                                                    <SubjectAssignment
                                                        key={subject.id}
                                                        subject={subject}
                                                        assignments={assignments}
                                                        expandedSubjects={expandedSubjects}
                                                        setExpandedSubjects={handleToggleSubjectExpantion}
                                                        onEditSubject={handleEditSubject}
                                                        onDeleteSubject={handleDeleteSubject}
                                                        onCreateAssignment={handleCreateAssignment}
                                                        onDeleteAssignment={handleDeleteAssignment}
                                                    />
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
                                <div className="grid gap-4 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
                                    {assignments.length === 0 ? (
                                        <p className="text-center text-muted-foreground">No hay asignaciones registradas.</p>
                                    ) : (
                                        assignments.map((assignment) => (
                                            <Card key={assignment.id}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                                <span className="font-medium">{assignment.subject.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <User className="h-4 w-4 text-muted-foreground" />
                                                                <span>
                                                                    {assignment.user.first_name} {assignment.user.last_name}
                                                                </span>
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
                                                                        onClick={() => handleDeleteAssignment(assignment.id)}
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

                <Dialog open={dialogoAsignacionAbierto} onOpenChange={setDialogoAsignacionAbierto}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Asignar Profesor a Materia</DialogTitle>
                            <DialogDescription>
                                {assignment.materiaId ? (
                                    <>
                                        Asigna un profesor a la materia:{" "}
                                        <strong>
                                            {subjects.find((s) => s.id === assignment.materiaId)?.name || "Materia no encontrada"}
                                        </strong>
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
                                            {subjects.map((materia) => (
                                                <SelectItem key={materia.id} value={materia.id}>
                                                    {materia.name}
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
                            <Button onClick={handleSaveAssignment}>Asignar Profesor</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <ConfirmAction
                    title="asignación"
                    text={confirmDeleteAssignmentText}
                    setText={setConfirmDeleteAssignmentText}
                    open={confirmDeleteAssignmentOpen}
                    setOpen={setConfirmDeleteAssignmentOpen}
                    onDelete={confirmDeleteAssignment}
                />
            </div>
        </section>
    )
}

export default SubjectsPage
