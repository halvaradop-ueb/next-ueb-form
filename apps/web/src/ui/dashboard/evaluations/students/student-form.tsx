"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { z } from "zod"
import { Card, CardContent } from "@/components/ui/card"
import { HeaderSteps } from "../header-steps"
import { FooterSteps } from "../footer-steps"
import { FeedbackStep } from "./feedback-step"
import { Confirmation } from "../confirmation"
import { EvaluationStep } from "./evaluation-step"
import { SelectSubjectStep } from "./select-subject-step"
import { addAnswer } from "@/services/answer"
import { Question } from "@/lib/@types/services"
import { addFeedback } from "@/services/feedback"
import { defaultAnswer, generateSchema } from "@/lib/utils"
import { getQuestionsForStudents } from "@/services/questions"
import type { Step, StudentFormState } from "@/lib/@types/types"
import { FeedbackFormSchema, AssignedStudentSchema } from "@/lib/schema"

const getSteps = (
    formData: StudentFormState,
    errors: Record<string, string>,
    onChange: (key: keyof StudentFormState, value: any) => void,
    onChangeAnswer: (key: string, value: any) => void,
    stages: Partial<Record<string, Question[]>>
): Step[] => {
    const mappedStages = Object.keys(stages).map((key, index) => ({
        id: `step-generated-${index}`,
        name: key,
        component: (
            <EvaluationStep
                questions={stages[key] ?? []}
                formData={formData}
                errors={errors}
                setFormData={onChange}
                onChangeAnswer={onChangeAnswer}
            />
        ),
        schema: generateSchema(stages[key]) ?? z.object({}),
    }))
    return [
        {
            id: "step-1",
            name: "Curso",
            component: <SelectSubjectStep formData={formData} errors={errors} setFormData={onChange} />,
            schema: AssignedStudentSchema,
        },
        ...mappedStages,
        {
            id: "step-3",
            name: "Comentarios",
            component: <FeedbackStep formData={formData} setFormData={onChange} />,
            schema: FeedbackFormSchema,
        },
        {
            id: "step-4",
            name: "Confirmación",
            component: <Confirmation />,
            schema: z.object({}),
        },
    ]
}

const initialState = (questions: Question[]) => {
    return {
        answers: questions.reduce((previous, now) => ({ ...previous, [now.id]: defaultAnswer(now) }), {}),
    } as StudentFormState
}

export const StudentForm = () => {
    const { data: session } = useSession()
    const [indexStep, setIndexStep] = useState(0)
    const [questions, setQuestions] = useState<Question[]>([])
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [formData, setFormData] = useState<StudentFormState>({} as StudentFormState)
    const [questionStages, setQuestionStages] = useState<Partial<Record<string, Question[]>>>({})

    const handlePrevStep = () => {
        if (indexStep > 0) {
            setIndexStep((prev) => prev - 1)
        }
    }

    const handleNextStep = () => {
        if (!(indexStep in steps) || !steps[indexStep]) return
        const data = steps[indexStep].id.includes("step-generated-") ? formData.answers : formData
        const isValid = steps[indexStep].schema.safeParse(data)
        if (indexStep < steps.length - 1) {
            if (!isValid.success) {
                isValid.error.errors.forEach((error) => {
                    setErrors((prev) => ({
                        ...prev,
                        [error.path[0] as string]: error.message,
                    }))
                })
            } else {
                setIndexStep((prev) => prev + 1)
            }
        }
    }

    const handleChange = (key: keyof StudentFormState, value: any) => {
        setFormData((previous) => ({
            ...previous,
            [key]: value,
        }))
        if (errors[key] && value) {
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
        if (errors[questionId]) {
            setErrors((previous) => {
                const newErrors = { ...previous }
                delete newErrors[questionId]
                return newErrors
            })
        }
    }

    const handleSend = async () => {
        if (!session || !session.user || !session.user.id) return
        await addAnswer(formData, session.user.id)
        await addFeedback(formData, session.user.id)
        setIndexStep(0)
        setFormData(() => initialState(questions))
    }

    const steps = getSteps(formData, errors, handleChange, handleChangeAnswer, questionStages)

    useEffect(() => {
        const fetchQuestions = async () => {
            const [questions, questionsStages] = await getQuestionsForStudents()
            setQuestions(questions)
            setQuestionStages(questionsStages)
            const answers = questions.reduce((previous, now) => ({ ...previous, [now.id]: defaultAnswer(now) }), {})
            setFormData((previous) => ({ ...previous, answers }))
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
                    <div className="min-h-[300px]">{steps.length > 0 && steps[indexStep] && steps[indexStep].component}</div>
                    <FooterSteps
                        steps={steps}
                        indexStep={indexStep}
                        onPrevStep={handlePrevStep}
                        onNextStep={handleNextStep}
                        onSend={handleSend}
                    />
                </CardContent>
            </Card>
        </section>
    )
}
