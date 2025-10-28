"use client"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSubjectsByProfessorId } from "@/services/subjects"
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

    const filteredSubjects = selectedSemester ? subjects.filter((s) => s.semestre === selectedSemester) : subjects

    return (
        <section className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Autoevaluación</h2>
                <p className="text-muted-foreground">Por favor reflexione sobre su enseñanza y proporcione comentarios</p>
            </div>
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
                        <SelectTrigger id="selfEvalSubject">
                            <SelectValue placeholder="Seleccione una asignatura" />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredSubjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                    {subject.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </section>
    )
}
