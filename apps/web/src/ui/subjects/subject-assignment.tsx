import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { SubjectAssignmentProps } from "@/lib/@types/props"
import { ChevronDown, ChevronRight, Trash2, User, UserMinus, UserPlus } from "lucide-react"
import { ConfirmAction } from "../common/confirm-action"
import { useState } from "react"

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
    const [textConfirmation, setTextConfirmation] = useState("")
    const [openDialogDeleteSubject, setOpenDialogDeleteSubject] = useState(false)

    return (
        <>
            <TableRow className={isExpanded ? "border-b-0" : ""}>
                <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setExpandedSubjects(subject.id)} className="h-6 w-6">
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
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Eliminar materia"
                            onClick={() => setOpenDialogDeleteSubject(true)}
                        >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Eliminar</span>
                        </Button>
                        <ConfirmAction
                            title="Materia"
                            text={textConfirmation}
                            setText={setTextConfirmation}
                            open={openDialogDeleteSubject}
                            setOpen={setOpenDialogDeleteSubject}
                            onDelete={() => onDeleteSubject(subject.id)}
                        />
                    </div>
                </TableCell>
            </TableRow>
            {isExpanded && (
                <TableRow key={`expanded-${subject.id}`}>
                    <TableCell colSpan={7} className="bg-muted/30 p-0">
                        <div className="p-4">
                            <h4 className="text-sm font-medium mb-2">Profesores asignados</h4>
                            {professors.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No hay profesores asignados a esta materia.</p>
                            ) : (
                                <div className="space-y-2">
                                    {professors.map(({ id: assignmentId, user: { id, first_name, last_name } }) => (
                                        <div key={id} className="flex items-center justify-between bg-background rounded-md p-2">
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
