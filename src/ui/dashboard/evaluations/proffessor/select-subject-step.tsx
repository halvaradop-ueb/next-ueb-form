"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SubjectService } from "@/lib/@types/services"
import { getSubjectsByProfessorId } from "@/services/subjects"
import { SelectSubjectStepProps } from "@/lib/@types/props"
import { ProfessorFormState } from "@/lib/@types/types"

export const SelectSubject = ({ formData, setFormData }: SelectSubjectStepProps<ProfessorFormState>) => {
    const { data: session } = useSession()
    const [subjects, setSubjects] = useState<SubjectService[]>([])

    useEffect(() => {
        const fetchSubjects = async () => {
            if (!session || !session.user) return
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
                    <Select>
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
