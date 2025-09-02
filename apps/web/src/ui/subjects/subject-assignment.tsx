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
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { SubjectAssignmentProps } from "@/lib/@types/props"
import { ChevronDown, ChevronRight, Trash2, User, UserMinus, UserPlus } from "lucide-react"

export const SubjectAssignment = ({
    subject,
    assignments,
    expandedSubjects,
    setExpandedSubjects,
    onDeleteSubject,
    onCreateAssignment,
    onDeleteAssignment,
}: SubjectAssignmentProps) => {
    const isExpanded = expandedSubjects.includes(subject.id)
    const professors = assignments.filter((assignment) => assignment.subject_id === subject.id)

    return (
        <>
            <TableRow className={isExpanded ? "border-b-0" : ""}>
                <TableCell>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedSubjects(subject.id)}
                        className="h-6 w-6"
                    >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
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
                            onClick={() => onCreateAssignment(subject.id)}
                            title="Asignar profesor"
                        >
                            <UserPlus className="h-4 w-4" />
                            <span className="sr-only">Asignar profesor</span>
                        </Button>
                        {/* <Button variant="ghost" size="icon" onClick={() => onEditSubject(subject.id)} title="Editar materia">
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                        </Button> */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Eliminar materia">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                    <span className="sr-only">Eliminar</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Está seguro de eliminar esta materia?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. La materia y todas sus asignaciones se
                                        eliminarán permanentemente.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => onDeleteSubject(subject.id)}
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
                <TableRow key={`expanded-${subject.id}`}>
                    <TableCell colSpan={7} className="bg-muted/30 p-0">
                        <div className="p-4">
                            <h4 className="text-sm font-medium mb-2">Profesores asignados</h4>
                            {professors.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No hay profesores asignados a esta materia.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {professors.map(({ id: assignmentId, user: { id, first_name, last_name } }) => (
                                        <div
                                            key={id}
                                            className="flex items-center justify-between bg-background rounded-md p-2"
                                        >
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">
                                                    {first_name} {last_name}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDeleteAssignment(assignmentId)}
                                                title="Eliminar asignación"
                                            >
                                                <UserMinus className="h-4 w-4 text-red-500" />
                                                <span className="sr-only">Eliminar asignación</span>
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
}
