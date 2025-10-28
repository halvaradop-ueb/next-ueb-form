"use client"
import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getProfessors } from "@/services/professors"
import { getSubjectsByProfessorId } from "@/services/subjects"
import type { SelectSubjectStepProps } from "@/lib/@types/props"
import type { ProfessorService, SubjectService } from "@/lib/@types/services"

export const SelectSubjectStep = ({ formData, errors, setFormData }: SelectSubjectStepProps) => {
    const [subjects, setSubjects] = useState<SubjectService[]>([])
    const [professors, setProfessors] = useState<ProfessorService[]>([])
    const [selectedSemester, setSelectedSemester] = useState<string>("")
    const [semesters, setSemesters] = useState<string[]>([])

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

    const filteredSubjects = selectedSemester ? subjects.filter((s) => s.semestre === selectedSemester) : subjects

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
                        disabled={!formData.professor}
                        onValueChange={(value) => setFormData("subject", value)}
                    >
                        <SelectTrigger className="w-full" id="subject">
                            <SelectValue placeholder="Materia" />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredSubjects.map(({ id, name }) => (
                                <SelectItem key={id} value={id}>
                                    {name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.subject && <p className="text-red-500 text-sm">{errors.subject}</p>}
                </div>
            </form>
        </section>
    )
}
