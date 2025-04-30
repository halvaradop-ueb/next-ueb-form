"use client"
import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ProfessorService, Question, SubjectService } from "@/lib/@types/services"
import { getProfessors } from "@/services/professors"
import { SelectSubjectStepProps } from "@/lib/@types/props"
import { getSubjectsByProfessorId } from "@/services/subjects"

export const SelectSubjectStep = ({ formData, setFormData }: SelectSubjectStepProps) => {
    const [subjects, setSubjects] = useState<SubjectService[]>([])
    const [professors, setProfessors] = useState<ProfessorService[]>([])
    const [questions, setQuestions] = useState<Question[]>([])

    useEffect(() => {
        const fetchData = async () => {
            const [professors] = await Promise.all([getProfessors()])
            setProfessors(professors)
        }
        fetchData()
    }, [])

    useEffect(() => {
        const fetchSubjects = async () => {
            const subjects = await getSubjectsByProfessorId(formData.professor)
            setSubjects(subjects)
        }
        fetchSubjects()
        setFormData("subject", null)
    }, [formData.professor])

    return (
        <section>
            <div>
                <h2 className="text-2xl font-bold">Seleccion de Docente y Materia</h2>
                <p className="text-muted-foreground">
                    Por favor selecciona al docente y materia que vas a realizar la evaluación docente
                </p>
            </div>
            <form className="mt-6 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="proffessor">Selecciona al docente</Label>
                    <Select value={formData.professor} onValueChange={(value) => setFormData("professor", value)}>
                        <SelectTrigger className="w-full" id="proffessor">
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
                </div>
                <div className="space-y-2">
                    <Label htmlFor="subject">Selecciona la materia</Label>
                    <Select
                        value={formData.subject}
                        disabled={!formData.professor}
                        onValueChange={(value) => setFormData("subject", value)}
                    >
                        <SelectTrigger className="w-full" id="subject">
                            <SelectValue placeholder="Materia" />
                        </SelectTrigger>
                        <SelectContent>
                            {subjects.map(({ id, name }) => (
                                <SelectItem key={id} value={id}>
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </form>
        </section>
    )
}
