"use client"
import { useState, useEffect } from "react"
import { z } from "zod"
import { Card, CardContent } from "@/components/ui/card"
import { HeaderSteps } from "../header-steps"
import { FooterSteps } from "../footer-steps"
import { Confirmation } from "../confirmation"
import { SelectSubject } from "./select-subject-step"
import { EvaluationStep } from "../students/evaluation-step"
import { addAutoEvaluationAnswer } from "@/services/answer"
import { Question } from "@/lib/@types/services"
import { AssignedProfessorSchema } from "@/lib/schema"
import { defaultAnswer, generateSchema } from "@/lib/utils"
import { getQuestionsForProfessors } from "@/services/questions"
import type { ProfessorFormState, Step } from "@/lib/@types/types"
import { ProfessorFormProps } from "@/lib/@types/props"

const getSteps = (
    formData: ProfessorFormState,
    errors: Record<string, string>,
    onChange: (key: keyof ProfessorFormState, value: any) => void,
    onChangeAnswer: (key: string, value: any) => void,
    stages: Partial<Record<string, Question[]>>
): Step[] => {
    const mappedStages = Object.keys(stages).map((key, index) => ({
        id: `step-${index + 10}`,
        name: key,
        component: (
            <EvaluationStep
                questions={stages[key] ?? []}
                errors={errors}
                formData={formData as any}
                setFormData={onChange as any}
                onChangeAnswer={onChangeAnswer}
            />
        ),
        schema: generateSchema(stages[key]) ?? z.object({}),
    }))
    return [
        {
            id: "step-1",
            name: "Evaluación",
            component: <SelectSubject formData={formData} errors={errors} setFormData={onChange} />,
            schema: AssignedProfessorSchema,
        },
        ...mappedStages,
        {
            id: "step-4",
            name: "Confirmación",
            component: <Confirmation />,
            schema: z.object({}),
        },
    ]
}

const calculateSemester = (): string => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // getMonth() returns 0-11

    // If it's after June, it's the second semester of the current year
    // If it's January to June, it's the first semester of the current year
    if (currentMonth > 6) {
        return `${currentYear} - 2`
    } else {
        return `${currentYear} - 1`
    }
}

const initialState = (questions: Question[]) => {
    return {
        answers: questions.reduce((previous, now) => ({ ...previous, [now.id]: defaultAnswer(now) }), {}),
    } as ProfessorFormState
}

export const ProffessorForm = ({ session }: ProfessorFormProps) => {
    const [indexStep, setIndexStep] = useState(0)
    const [questions, setQuestions] = useState<Question[]>([])
    const [formData, setFormData] = useState<ProfessorFormState>({} as ProfessorFormState)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [questionStages, setQuestionStages] = useState<Partial<Record<string, Question[]>>>({})

    const handleNextStep = () => {
        if (indexStep < steps.length - 1) {
            setIndexStep((prev) => prev + 1)
        }
    }

    const handlePrevStep = () => {
        if (indexStep > 0) {
            setIndexStep((prev) => prev - 1)
        }
    }

    const handleChange = (key: keyof ProfessorFormState, value: any) => {
        setFormData((previous) => ({
            ...previous,
            [key]: value,
        }))
        if (errors[key]) {
            setErrors((previous) => {
                const newErrors = { ...previous }
                delete newErrors[key]
                return newErrors
            })
        }
    }

    const handleChangeAnswer = (questionId: string, value: any) => {
        setFormData((previous) => ({
            ...previous,
            answers: {
                ...previous.answers,
                [questionId]: value,
            },
        }))
    }

    const handleSend = async () => {
        if (!session || !session.user || !session.user.id) return

        // Add professor ID and semester to form data
        const currentSemester = calculateSemester()
        const formDataWithMeta = {
            ...formData,
            professorId: session.user.id,
            semester: currentSemester,
        }

        console.log("🚀 [PROFESSOR FORM] Starting auto-evaluation submission...")
        console.log("📋 [PROFESSOR FORM] Form data being sent:", formDataWithMeta)

        try {
            const result = await addAutoEvaluationAnswer(formDataWithMeta, session.user.id)

            if (result.success) {
                console.log("✅ [PROFESSOR FORM] Auto-evaluation submitted successfully!")
                console.log("📊 [PROFESSOR FORM] Submission summary:", result.data?.summary)

                // Show success message to user
                alert(
                    `✅ Auto-evaluación enviada exitosamente!\n\n` +
                        `📚 Asignatura: ${formData.subject}\n` +
                        `👤 Profesor ID: ${session.user.id}\n` +
                        `📅 Semestre: ${currentSemester}\n` +
                        `📝 Respuestas: ${result.data?.summary?.answersCount || 0}\n` +
                        `💾 Registros guardados: ${result.data?.summary?.recordsFound || 0}\n\n` +
                        `🔍 Puedes verificar los datos guardados en la consola del navegador.`
                )

                // Reset form
                setIndexStep(0)
                setFormData(() => initialState(questions))
            } else {
                console.error("❌ [PROFESSOR FORM] Failed to submit auto-evaluation:", result.error)
                console.error("❌ [PROFESSOR FORM] Error details:", result.details)

                let errorMessage = `❌ Error al enviar la auto-evaluación:\n\n${result.error}`

                if (result.details?.errors && Array.isArray(result.details.errors)) {
                    errorMessage += `\n\n🔧 Detalles del error:\n${result.details.errors.map((error: string) => `• ${error}`).join("\n")}`
                }

                errorMessage += `\n\n💡 Solución: Asegúrate de que los IDs de las preguntas existan en la base de datos antes de enviar la evaluación.`

                alert(errorMessage)
            }
        } catch (error) {
            console.error("❌ [PROFESSOR FORM] Unexpected error:", error)
            alert("❌ Error inesperado al enviar la auto-evaluación")
        }
    }

    const steps = getSteps(formData, errors, handleChange, handleChangeAnswer, questionStages)

    useEffect(() => {
        const fetchQuestions = async () => {
            const [questions, questionsStages] = await getQuestionsForProfessors()
            setQuestionStages(questionsStages)
            const answers = questions.reduce((previous, now) => ({ ...previous, [now.id]: defaultAnswer(now) }), {})
            setFormData((previous) => ({
                ...previous,
                answers,
            }))
            setQuestions(questions)
        }
        fetchQuestions()
    }, [])

    return (
        <section className="space-y-8">
            <div className="flex flex-wrap justify-between gap-y-4">
                <HeaderSteps indexStep={indexStep} steps={steps} />
            </div>
            <Card>
                <CardContent className="p-6">
                    <div className="min-h-[300px]">{steps[indexStep] && steps[indexStep].component}</div>
                    <FooterSteps
                        indexStep={indexStep}
                        steps={steps}
                        onPrevStep={handlePrevStep}
                        onNextStep={handleNextStep}
                        onSend={handleSend}
                    />
                </CardContent>
            </Card>
        </section>
    )
}
