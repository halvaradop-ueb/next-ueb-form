"use client"
import { useState, useEffect } from "react"
import { z } from "zod"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { HeaderSteps } from "../header-steps"
import { FooterSteps } from "../footer-steps"
import { Confirmation } from "../confirmation"
import { SelectSubject } from "./select-subject-step"
import { EvaluationStep } from "../students/evaluation-step"
import { addAnswer } from "@/services/answer"
import { Question } from "@/lib/@types/services"
import { AssignedProfessorSchema } from "@/lib/schema"
import { defaultAnswer, generateSchema } from "@/lib/utils"
import { getQuestionsForProfessors } from "@/services/questions"
import type { ProfessorFormState, Step } from "@/lib/@types/types"

const getSteps = (
    formData: ProfessorFormState,
    errors: Record<string, string>,
    onChange: (key: keyof ProfessorFormState, value: any) => void,
    onChangeAnswer: (key: string, value: any) => void,
    stages: Partial<Record<string, Question[]>>,
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

const initialState = (questions: Question[]) => {
    return {
        answers: questions.reduce((previous, now) => ({ ...previous, [now.id]: defaultAnswer(now) }), {}),
    } as ProfessorFormState
}

export const ProffessorForm = () => {
    const { data: session } = useSession()
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
        await addAnswer(formData, session.user.id)
        setIndexStep(0)
        setFormData(() => initialState(questions))
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
                    <div className="min-h-[300px]">{steps[indexStep].component}</div>
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
