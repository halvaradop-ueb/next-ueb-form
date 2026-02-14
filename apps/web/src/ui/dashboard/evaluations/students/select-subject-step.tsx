"use client"
import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getProfessors } from "@/services/professors"
import { getSubjectsByProfessorId } from "@/services/subjects"
import { getCompletedStudentEvaluations } from "@/services/answer"
import type { SelectSubjectStepProps } from "@/lib/@types/props"
import type { ProfessorService, SubjectService } from "@/lib/@types/services"

interface CompletedEvaluation {
    professorId: string
    subjectId: string
    semester: string
}

export const SelectSubjectStep = ({ formData, errors, setFormData, session }: SelectSubjectStepProps & { session: any }) => {
    const [subjects, setSubjects] = useState<SubjectService[]>([])
    const [professors, setProfessors] = useState<ProfessorService[]>([])
    const [selectedSemester, setSelectedSemester] = useState<string>("")
    const [semesters, setSemesters] = useState<string[]>([])
    const [completedEvaluations, setCompletedEvaluations] = useState<CompletedEvaluation[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const professors = await getProfessors()
            setProfessors(professors)
        }
        fetchData()
    }, [])

    useEffect(() => {
        const fetchSubjects = async () => {
            if (!formData.professor) return
            const subjects = await getSubjectsByProfessorId(formData.professor)
            setSubjects(subjects)
            const uniqueSemesters = [...new Set(subjects.map((s) => s.semestre).filter(Boolean))]
            setSemesters(uniqueSemesters)
            if (uniqueSemesters.length > 0) {
                setSelectedSemester(uniqueSemesters[0])
            }
        }
        fetchSubjects()
        setFormData("subject", null)
    }, [formData.professor])

    // Fetch completed evaluations for the student
    useEffect(() => {
        const fetchCompletedEvaluations = async () => {
            if (!session?.user?.id) return
            const completed = await getCompletedStudentEvaluations(session.user.id)
            setCompletedEvaluations(completed)
            setIsLoading(false)
        }
        fetchCompletedEvaluations()
    }, [session])

    const filteredSubjects = selectedSemester ? subjects.filter((s) => s.semestre === selectedSemester) : subjects

    // Check if a subject has been evaluated
    const isSubjectCompleted = (subjectId: string, professorId: string) => {
        return completedEvaluations.some(
            (completed) => completed.subjectId === subjectId && completed.professorId === professorId
        )
    }

    // Calculate current semester
    const calculateCurrentSemester = (): string => {
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1
        if (currentMonth > 6) {
            return `${currentYear} - 2`
        }
        return `${currentYear} - 1`
    }

    const currentSemester = calculateCurrentSemester()

    return (
        <section>
            <div>
                <h2 className="text-2xl font-bold">Seleccion de Docente y Materia</h2>
                <p className="text-muted-foreground">
                    Por favor selecciona al docente y materia que vas a realizar la evaluación docente
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
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="professor">Selecciona al docente</Label>
                        <span className="text-red-500 text-sm">*</span>
                    </div>
                    <Select value={formData.professor} onValueChange={(value) => setFormData("professor", value)}>
                        <SelectTrigger className="w-full" id="professor">
                            <SelectValue placeholder="Docente" />
                        </SelectTrigger>
                        <SelectContent>
                            {professors.map(({ id, first_name, last_name }) => (
                                <SelectItem key={id} value={id}>
                                    {first_name} {last_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.professor && <p className="text-red-500 text-sm">{errors.professor}</p>}
                </div>

                {semesters.length > 0 && (
                    <div className="space-y-2">
                        <Label>Semestre</Label>
                        <Tabs value={selectedSemester || semesters[0]} onValueChange={setSelectedSemester}>
                            <TabsList className="grid w-full grid-cols-4">
                                {semesters.map((semester) => (
                                    <TabsTrigger key={semester} value={semester}>
                                        {semester}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                )}

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="subject">Selecciona la materia</Label>
                        <span className="text-red-500 text-sm">*</span>
                    </div>
                    <Select
                        value={formData.subject}
                        disabled={!formData.professor || isLoading}
                        onValueChange={(value) => setFormData("subject", value)}
                    >
                        <SelectTrigger
                            className={`w-full ${formData.subject && isSubjectCompleted(formData.subject, formData.professor) ? "bg-green-50 border-green-300" : ""}`}
                            id="subject"
                        >
                            <SelectValue placeholder="Materia" />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredSubjects.map((subject) => {
                                const completed = isSubjectCompleted(subject.id, formData.professor)
                                const isCurrentSemester = subject.semestre === currentSemester
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
                                            {!completed && isCurrentSemester && (
                                                <span className="text-xs text-blue-600">(Actual)</span>
                                            )}
                                        </div>
                                    </SelectItem>
                                )
                            })}
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
