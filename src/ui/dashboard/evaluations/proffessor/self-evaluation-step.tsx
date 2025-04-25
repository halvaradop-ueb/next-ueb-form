"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

interface ProfessorSelfEvaluationStepProps {
    formData: FormData
    updateFormData: (field: keyof FormData, value: string) => void
}

const subjects = [
    { id: "math", name: "Matemáticas" },
    { id: "cs", name: "Ciencias de la Computación" },
    { id: "physics", name: "Física" },
    { id: "chemistry", name: "Química" },
    { id: "biology", name: "Biología" },
]

export const SelfEvaluation = () => {
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
                <Card>
                    <CardContent className="p-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="teachingMethods">Métodos de Enseñanza</Label>
                                <Textarea
                                    id="teachingMethods"
                                    placeholder="Describa los métodos de enseñanza que utilizó este semestre..."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="strengths">Fortalezas</Label>
                                <Textarea
                                    id="strengths"
                                    placeholder="¿Cuáles fueron sus fortalezas al enseñar este curso?"
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="areasToImprove">Áreas a Mejorar</Label>
                                <Textarea
                                    id="areasToImprove"
                                    placeholder="¿Qué áreas le gustaría mejorar en su enseñanza?"
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="professionalDevelopment">Desarrollo Profesional</Label>
                                <Textarea
                                    id="professionalDevelopment"
                                    placeholder="¿Qué actividades de desarrollo profesional le ayudarían a mejorar?"
                                    className="min-h-[100px]"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}
