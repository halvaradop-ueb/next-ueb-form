import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RenderQuestion } from "../render-question"
import type { EvaluationStepProps } from "@/lib/@types/props"

export const EvaluationStep = ({ questions, formData, setFormData, onChangeAnswer }: EvaluationStepProps) => {
    return (
        <section>
            <div>
                <h2 className="text-2xl font-bold">Selección de Curso</h2>
                <p className="text-muted-foreground">Selecciona tu materia y profesor</p>
            </div>
            <form className="mt-6 space-y-4">
                {questions.map((question) => (
                    <Card key={question.id}>
                        <CardContent className="p-2 space-y-2">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor={question.id} className="text-base font-medium">
                                            {question.title}
                                        </Label>
                                        {question.required && <span className="text-red-500 text-sm">*</span>}
                                    </div>
                                    {question.description && (
                                        <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
                                    )}
                                </div>
                                <RenderQuestion
                                    question={question}
                                    formData={formData}
                                    setFormData={setFormData}
                                    onChange={onChangeAnswer}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </form>
        </section>
    )
}
