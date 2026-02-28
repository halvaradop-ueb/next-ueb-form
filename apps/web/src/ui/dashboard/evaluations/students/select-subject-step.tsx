"use client"
import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { getProfessorsBySemester, ProfessorWithSubjects } from "@/services/subjects"
import { getCompletedStudentEvaluations } from "@/services/answer"
import type { SelectSubjectStepProps } from "@/lib/@types/props"

interface CompletedEvaluation {
    professorId: string
    subjectId: string
    semester: string
}

// Available academic semesters - only 3
const ACADEMIC_SEMESTERS = [
    { value: "Semestre 1", label: "Semestre 1" },
    { value: "Semestre 2", label: "Semestre 2" },
    { value: "Semestre 3", label: "Semestre 3" },
]

export const SelectSubjectStep = ({ formData, errors, setFormData, session }: SelectSubjectStepProps & { session: any }) => {
    const [professorsWithSubjects, setProfessorsWithSubjects] = useState<ProfessorWithSubjects[]>([])
    const [selectedProfessor, setSelectedProfessor] = useState<ProfessorWithSubjects | null>(null)
    const [completedEvaluations, setCompletedEvaluations] = useState<CompletedEvaluation[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [selectedAcademicSemester, setSelectedAcademicSemester] = useState<string>("")

    // Fetch professors with subjects when academic semester changes
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedAcademicSemester) {
                setProfessorsWithSubjects([])
                return
            }
            setIsLoading(true)
            const professors = await getProfessorsBySemester(selectedAcademicSemester)
            setProfessorsWithSubjects(professors)
            setIsLoading(false)
        }
        fetchData()
    }, [selectedAcademicSemester])

    // Fetch completed evaluations for the student
    useEffect(() => {
        const fetchCompletedEvaluations = async () => {
            if (!session?.user?.id) return
            const completed = await getCompletedStudentEvaluations(session.user.id)
            setCompletedEvaluations(completed)
        }
        fetchCompletedEvaluations()
    }, [session])

    // Update selected professor when formData.professor changes
    useEffect(() => {
        if (formData.professor && professorsWithSubjects.length > 0) {
            const professor = professorsWithSubjects.find((p) => p.id === formData.professor)
            setSelectedProfessor(professor || null)
        } else {
            setSelectedProfessor(null)
        }
    }, [formData.professor, professorsWithSubjects])

    // Reset professor and subject when academic semester changes
    useEffect(() => {
        setFormData("professor", null)
        setFormData("subject", null)
        setSelectedProfessor(null)
    }, [selectedAcademicSemester])

    // Reset subject when professor changes
    useEffect(() => {
        setFormData("subject", null)
    }, [formData.professor])

    // Check if a subject has been evaluated
    const isSubjectCompleted = (subjectId: string, professorId: string) => {
        return completedEvaluations.some(
            (completed) => completed.subjectId === subjectId && completed.professorId === professorId
        )
    }

    // Get subjects for the selected professor (already filtered by semester)
    const subjectsForProfessor = selectedProfessor?.subjects || []

    return (
        <section>
            <div>
                <h2 className="text-2xl font-bold">Seleccion de Docente y Materia</h2>
                <p className="text-muted-foreground">
                    Por favor selecciona tu semestre, el docente y la materia que vas a evaluar
                </p>
            </div>

            {/* Info about completed evaluations */}
            {!isLoading && completedEvaluations.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                        ✓ Ya has completado {completedEvaluations.length} evaluación(es). Las materias completadas se muestran en
                        verde.
                    </p>
                </div>
            )}

            <form className="mt-6 space-y-4">
                {/* Academic Semester Selection */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="semester">Selecciona tu semestre</Label>
                        <span className="text-red-500 text-sm">*</span>
                    </div>
                    <Select value={selectedAcademicSemester} onValueChange={setSelectedAcademicSemester}>
                        <SelectTrigger className="w-full" id="semester">
                            <SelectValue placeholder="Selecciona tu semestre académico" />
                        </SelectTrigger>
                        <SelectContent>
                            {ACADEMIC_SEMESTERS.map((semester) => (
                                <SelectItem key={semester.value} value={semester.value}>
                                    {semester.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Professor Selection */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="professor">Selecciona al docente</Label>
                        <span className="text-red-500 text-sm">*</span>
                    </div>
                    <Select
                        value={formData.professor || ""}
                        onValueChange={(value) => setFormData("professor", value)}
                        disabled={!selectedAcademicSemester || isLoading}
                    >
                        <SelectTrigger className="w-full" id="professor">
                            <SelectValue
                                placeholder={
                                    !selectedAcademicSemester
                                        ? "Primero selecciona tu semestre"
                                        : isLoading
                                          ? "Cargando..."
                                          : "Docente"
                                }
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {!selectedAcademicSemester ? (
                                <SelectItem value="_none" disabled>
                                    Primero selecciona tu semestre
                                </SelectItem>
                            ) : professorsWithSubjects.length === 0 ? (
                                <SelectItem value="_none" disabled>
                                    No hay docentes disponibles para este semestre
                                </SelectItem>
                            ) : (
                                professorsWithSubjects.map(({ id, first_name, last_name, subjects }) => (
                                    <SelectItem key={id} value={id}>
                                        {first_name} {last_name} ({subjects.length} materia{subjects.length !== 1 ? "s" : ""})
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    {errors.professor && <p className="text-red-500 text-sm">{errors.professor}</p>}
                </div>

                {/* Subject Selection */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="subject">Selecciona la materia</Label>
                        <span className="text-red-500 text-sm">*</span>
                    </div>
                    <Select
                        value={formData.subject || ""}
                        disabled={!formData.professor || isLoading}
                        onValueChange={(value) => setFormData("subject", value)}
                    >
                        <SelectTrigger
                            className={`w-full ${formData.subject && isSubjectCompleted(formData.subject, formData.professor) ? "bg-green-50 border-green-300" : ""}`}
                            id="subject"
                        >
                            <SelectValue
                                placeholder={
                                    !selectedAcademicSemester
                                        ? "Primero selecciona tu semestre"
                                        : !formData.professor
                                          ? "Primero selecciona un docente"
                                          : "Materia"
                                }
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {!formData.professor ? (
                                <SelectItem value="_none" disabled>
                                    Primero selecciona un docente
                                </SelectItem>
                            ) : subjectsForProfessor.length === 0 ? (
                                <SelectItem value="_none" disabled>
                                    Este docente no tiene materias en este semestre
                                </SelectItem>
                            ) : (
                                subjectsForProfessor.map((subject) => {
                                    const completed = isSubjectCompleted(subject.id, formData.professor)
                                    return (
                                        <SelectItem
                                            key={subject.id}
                                            value={subject.id}
                                            disabled={completed}
                                            className={completed ? "bg-green-50 text-green-700 font-medium" : ""}
                                        >
                                            <div className="flex items-center gap-2">
                                                {completed && <span className="text-green-600">✓</span>}
                                                <span>{subject.name}</span>
                                                {completed && <span className="text-xs text-green-600">(Completada)</span>}
                                            </div>
                                        </SelectItem>
                                    )
                                })
                            )}
                        </SelectContent>
                    </Select>
                    {formData.subject && isSubjectCompleted(formData.subject, formData.professor) && (
                        <p className="text-sm text-green-600 font-medium">✓ Esta materia ya ha sido evaluada</p>
                    )}
                    {errors.subject && <p className="text-red-500 text-sm">{errors.subject}</p>}
                </div>
            </form>
        </section>
    )
}
