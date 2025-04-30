import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { RenderQuestionProps } from "@/lib/@types/props"

export const RenderQuestion = ({ question, formData, setFormData, onChange }: RenderQuestionProps) => {
    const { id, question_type } = question
    switch (question_type) {
        case "text":
            return (
                <div className="space-y-2">
                    <Textarea
                        id={question.id}
                        value={formData.answers[question.id]}
                        onChange={(e) => onChange(question.id, e.target.value)}
                        placeholder="Escribe tu respuesta aquí..."
                    />
                </div>
            )
        case "single_choice":
            return (
                <div className="space-y-2">
                    <RadioGroup value={formData.answers[id] as string} onValueChange={(value) => onChange(id, value)}>
                        {question.options?.map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                                <Label htmlFor={`${question.id}-${option}`} className="font-normal">
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            )
        case "multiple_choice":
            return (
                <div className="space-y-2">
                    <div className={`space-y-2 ${false ? "border border-red-500 rounded-md p-2" : ""}`}>
                        {question.options?.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`${question.id}-${option}`}
                                    checked={(formData.answers[question.id] as string[]).includes(option)}
                                    onCheckedChange={(checked) => {
                                        const newAnswers = checked
                                            ? [...(formData.answers[question.id] as string[]), option]
                                            : (formData.answers[question.id] as string[]).filter((o) => o !== option)
                                        onChange(question.id, newAnswers)
                                    }}
                                />
                                <Label htmlFor={`${question.id}-${option}`} className="font-normal">
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            )
        case "numeric":
            return (
                <RadioGroup
                    className="pt-2 flex justify-between"
                    value={formData.answers[id] as string}
                    onValueChange={(value) => onChange(id, value)}
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                        <div className="flex items-center flex-col gap-y-1" key={value}>
                            <RadioGroupItem className="peer sr-only" value={value.toString()} id={`${id}-${value}`} />
                            <Label
                                className="flex size-8 cursor-pointer items-center justify-center text-xs rounded-full border-2 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                                htmlFor={`${id}-${value}`}
                            >
                                {value}
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            )
    }
}
