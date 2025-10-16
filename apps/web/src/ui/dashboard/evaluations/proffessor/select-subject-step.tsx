"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSubjectsByProfessorId } from "@/services/subjects"
import type { SubjectService } from "@/lib/@types/services"
import type { ProfessorFormState } from "@/lib/@types/types"
import type { SelectSubjectStepProps } from "@/lib/@types/props"

export const SelectSubject = ({ formData, setFormData }: SelectSubjectStepProps<ProfessorFormState>) => {
    const { data: session } = useSession()
    const [subjects, setSubjects] = useState<SubjectService[]>([])

    useEffect(() => {
        const fetchSubjects = async () => {
            if (!session?.user) return
            const subjects = await getSubjectsByProfessorId(session.user.id!)
            setSubjects(subjects)
        }
        fetchSubjects()
    }, [])

    return (
        <section className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Autoevaluación</h2>
                <p className="text-muted-foreground">Por favor reflexione sobre su enseñanza y proporcione comentarios</p>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="selfEvalSubject">Asignatura</Label>
                    <Select value={formData.subject} onValueChange={(value) => setFormData("subject", value)}>
                        <SelectTrigger id="selfEvalSubject">
                            <SelectValue placeholder="Seleccione una asignatura" />
                        </SelectTrigger>
                        <SelectContent>
                            {subjects.map((subject) => (
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
