"use client"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSubjectsByProfessorId } from "@/services/subjects"
import { verifyAutoEvaluationData } from "@/services/answer"
import type { SubjectService } from "@/lib/@types/services"
import type { ProfessorFormState } from "@/lib/@types/types"
import type { SelectSubjectStepProps } from "@/lib/@types/props"

export const SelectSubject = ({
    formData,
    setFormData,
    session,
}: SelectSubjectStepProps<ProfessorFormState> & { session: any }) => {
    const [subjects, setSubjects] = useState<SubjectService[]>([])
    const [selectedSemester, setSelectedSemester] = useState<string>("")
    const [semesters, setSemesters] = useState<string[]>([])
    const [completedSubjects, setCompletedSubjects] = useState<Set<string>>(new Set())

    useEffect(() => {
        const fetchSubjects = async () => {
            if (!session?.user?.id) return
            const subjects = await getSubjectsByProfessorId(session.user.id)
            setSubjects(subjects)
            const uniqueSemesters = [...new Set(subjects.map((s) => s.semestre).filter(Boolean))]
            setSemesters(uniqueSemesters)
            if (uniqueSemesters.length > 0) {
                setSelectedSemester(uniqueSemesters[0])
            }
        }
        fetchSubjects()
    }, [session])

    // Check which subjects have been completed
    useEffect(() => {
        const checkCompletedSubjects = async () => {
            if (!session?.user?.id) return

            const completed = new Set<string>()
            for (const subject of subjects) {
                if (subject.id) {
                    const result = await verifyAutoEvaluationData(session.user.id, subject.id)
                    if (result.success && result.data) {
                        completed.add(subject.id)
                    }
                }
            }
            setCompletedSubjects(completed)
        }

        if (subjects.length > 0) {
            checkCompletedSubjects()
        }
    }, [subjects, session])

    const filteredSubjects = selectedSemester ? subjects.filter((s) => s.semestre === selectedSemester) : subjects

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
        <section className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Autoevaluación</h2>
                <p className="text-muted-foreground">Por favor reflexione sobre su enseñanza y proporcione comentarios</p>
            </div>

            {/* Info about completed evaluations */}
            {completedSubjects.size > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                        ✓ Ya has completado {completedSubjects.size} autoevaluación(es). Las materias completadas se muestran en
                        verde.
                    </p>
                </div>
            )}

            <div className="space-y-4">
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
                    <Label htmlFor="selfEvalSubject">Asignatura</Label>
                    <Select value={formData.subject} onValueChange={(value) => setFormData("subject", value)}>
                        <SelectTrigger
                            id="selfEvalSubject"
                            className={
                                formData.subject && completedSubjects.has(formData.subject) ? "bg-green-50 border-green-300" : ""
                            }
                        >
                            <SelectValue placeholder="Seleccione una asignatura" />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredSubjects.map((subject) => {
                                const completed = completedSubjects.has(subject.id)
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
                    {formData.subject && completedSubjects.has(formData.subject) && (
                        <p className="text-sm text-green-600 font-medium">
                            ✓ Ya has completado tu autoevaluación para esta materia
                        </p>
                    )}
                </div>
            </div>
        </section>
    )
}
