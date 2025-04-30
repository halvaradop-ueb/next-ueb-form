"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { SelectSubjectStep } from "./select-subject-step"
import { FeedbackStep } from "./feedback-step"
import { Confirmation } from "../confirmation"
import { getQuestionsForStudents } from "@/services/questions"
import { Question } from "@/lib/@types/services"
import { EvaluationStep } from "./evaluation-step"
import { HeaderSteps } from "../header-steps"
import { FooterSteps } from "../footer-steps"
import type { StudentFormState } from "@/lib/@types/types"
import { defaultAnswer } from "@/lib/utils"
import { addAnswer } from "@/services/answer"
import { useSession } from "next-auth/react"
import { addFeedback } from "@/services/feedback"

const getSteps = (
    formData: StudentFormState,
    onChange: (key: keyof StudentFormState, value: any) => void,
    onChangeAnswer: (key: string, value: any) => void,
    stages: Partial<Record<string, Question[]>>,
) => {
    const mappedStages = Object.keys(stages).map((key, index) => ({
        id: `step-${index + 10}`,
        name: key,
        component: (
            <EvaluationStep
                questions={stages[key] ?? []}
                formData={formData}
                setFormData={onChange}
                onChangeAnswer={onChangeAnswer}
            />
        ),
    }))
    return [
        {
            id: "step-1",
            name: "Curso",
            component: <SelectSubjectStep formData={formData} setFormData={onChange} />,
        },
        ...mappedStages,
        {
            id: "step-3",
            name: "Comentarios",
            component: <FeedbackStep formData={formData} setFormData={onChange} />,
        },
        {
            id: "step-4",
            name: "Confirmación",
            component: <Confirmation />,
        },
    ]
}

const initialState = (questions: Question[]) => {
    return {
        answers: questions.reduce((previous, now) => ({ ...previous, [now.id]: defaultAnswer(now) }), {}),
    } as StudentFormState
}

export const StudentForm = () => {
    const [indexStep, setIndexStep] = useState(0)
    const [questions, setQuestions] = useState<Question[]>([])
    const [formData, setFormData] = useState<StudentFormState>({} as StudentFormState)
    const [questionStages, setQuestionStages] = useState<Partial<Record<string, Question[]>>>({})
    const { data: session } = useSession()

    const handlePrevStep = () => {
        if (indexStep > 0) {
            setIndexStep((prev) => prev - 1)
        }
    }

    const handleNextStep = () => {
        if (indexStep < steps.length - 1) {
            setIndexStep((prev) => prev + 1)
        }
    }

    const handleChange = (key: keyof StudentFormState, value: any) => {
        setFormData((previous) => ({
            ...previous,
            [key]: value,
        }))
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
        await addFeedback(formData, session.user.id)
        setIndexStep(0)
        setFormData(() => initialState(questions))
    }

    const steps = getSteps(formData, handleChange, handleChangeAnswer, questionStages)

    useEffect(() => {
        const fetchQuestions = async () => {
            const [questions, questionsStages] = await getQuestionsForStudents()
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
