"use client"
import { useState, useEffect } from "react"
import { z } from "zod"
import { Card, CardContent } from "@/components/ui/card"
import { HeaderSteps } from "../header-steps"
import { FooterSteps } from "../footer-steps"
import { Confirmation } from "../confirmation"
import { SelectSubject } from "./select-subject-step"
import { EvaluationStep } from "../students/evaluation-step"
import { addAutoEvaluationAnswer, verifyAutoEvaluationData } from "@/services/answer"
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
    stages: Partial<Record<string, Question[]>>,
    session: any
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
            component: <SelectSubject formData={formData} errors={errors} setFormData={onChange} session={session} />,
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
    const currentMonth = now.getMonth() + 1

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
    const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)

    const handleNextStep = () => {
        // Check if trying to navigate to evaluation step when already completed
        if (indexStep >= 1 && isAlreadyCompleted && formData.subject) {
            alert("Ya has completado tu autoevaluación para esta materia. No puedes volver a hacerla.")
            return
        }

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
        if (!session?.user?.id) return

        // Double check if already completed before submitting
        if (formData.subject) {
            const verifyResult = await verifyAutoEvaluationData(session.user.id, formData.subject)
            if (verifyResult.success && verifyResult.data) {
                alert("Ya has completado tu autoevaluación para esta materia. No puedes volver a hacerla.")
                return
            }
        }

        const currentSemester = calculateSemester()
        const formDataWithMeta = {
            ...formData,
            professorId: session.user.id,
            semester: currentSemester,
        }

        try {
            const result = await addAutoEvaluationAnswer(formDataWithMeta, session.user.id)

            if (result.success) {
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

    const steps = getSteps(formData, errors, handleChange, handleChangeAnswer, questionStages, session)

    // Check if the selected auto-evaluation has already been completed
    useEffect(() => {
        const checkIfCompleted = async () => {
            if (formData.subject && session?.user?.id) {
                const result = await verifyAutoEvaluationData(session.user.id, formData.subject)
                setIsAlreadyCompleted(result.success && result.data)
            }
        }
        checkIfCompleted()
    }, [formData.subject, session])

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
            {/* Show warning if already completed */}
            {isAlreadyCompleted && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    <p className="font-bold">✓ Autoevaluación completada</p>
                    <p>
                        Ya has completado tu autoevaluación para esta materia. Puedes ver tus respuestas pero no puedes
                        modificarlas.
                    </p>
                </div>
            )}
            <div className="flex flex-wrap justify-between gap-y-4">
                <HeaderSteps indexStep={indexStep} steps={steps} />
            </div>
            <Card>
                <CardContent className="p-6">
                    <div className="min-h-[300px]">{steps[indexStep]?.component}</div>
                    <FooterSteps
                        indexStep={indexStep}
                        steps={steps}
                        onPrevStep={handlePrevStep}
                        onNextStep={handleNextStep}
                        onSend={handleSend}
                        disabled={isAlreadyCompleted}
                    />
                </CardContent>
            </Card>
        </section>
    )
}
