"use client"
import { useState, useEffect } from "react"
import { z } from "zod"
import { Card, CardContent } from "@/components/ui/card"
import { HeaderSteps } from "../header-steps"
import { FooterSteps } from "../footer-steps"
import { FeedbackStep } from "./feedback-step"
import { Confirmation } from "../confirmation"
import { EvaluationStep } from "./evaluation-step"
import { SelectSubjectStep } from "./select-subject-step"
import { ConsentDialog } from "./consent-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Question } from "@/lib/@types/services"
import { addFeedback } from "@/services/feedback"
import { addStudentEvaluation, verifyStudentEvaluationData } from "@/services/answer"
import { defaultAnswer, generateSchema } from "@/lib/utils"
import { getQuestionsForStudents } from "@/services/questions"
import type { Step, StudentFormState } from "@/lib/@types/types"
import { FeedbackFormSchema, AssignedStudentSchema } from "@/lib/schema"
import { StudentFormProps } from "@/lib/@types/props"
import { useRouter } from "next/navigation"

const getSteps = (
    formData: StudentFormState,
    errors: Record<string, string>,
    onChange: (key: keyof StudentFormState, value: any) => void,
    onChangeAnswer: (key: string, value: any) => void,
    stages: Partial<Record<string, Question[]>>,
    session: any
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
            component: <SelectSubjectStep formData={formData} errors={errors} setFormData={onChange} session={session} />,
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
    } as StudentFormState
}

export const StudentForm = ({ session }: StudentFormProps) => {
    const router = useRouter()
    const [indexStep, setIndexStep] = useState(0)
    const [questions, setQuestions] = useState<Question[]>([])
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [formData, setFormData] = useState<StudentFormState>({} as StudentFormState)
    const [questionStages, setQuestionStages] = useState<Partial<Record<string, Question[]>>>({})
    const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [showSuccessDialog, setShowSuccessDialog] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handlePrevStep = () => {
        if (indexStep > 0) {
            setIndexStep((prev) => prev - 1)
        }
    }

    const handleNextStep = () => {
        if (!(indexStep in steps) || !steps[indexStep]) return

        // Check if trying to navigate to evaluation step when already completed
        if (indexStep >= 1 && isAlreadyCompleted && formData.professor && formData.subject) {
            alert("Ya has completado esta evaluación. No puedes volver a hacerla.")
            return
        }

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
        if (!session?.user?.id) return
        setShowConfirmDialog(true)
    }

    const confirmSend = async () => {
        if (!session?.user?.id) return
        setShowConfirmDialog(false)
        setIsSubmitting(true)

        // Double check if already completed before submitting
        if (formData.professor && formData.subject) {
            const verifyResult = await verifyStudentEvaluationData(formData.professor, formData.subject, session.user.id)
            if (verifyResult.success && verifyResult.data) {
                alert("Ya has completado esta evaluación. No puedes volver a hacerla.")
                setIsSubmitting(false)
                return
            }
        }

        await addFeedback(formData, session.user.id)

        if (formData.subject && formData.answers && formData.professor) {
            const currentSemester = calculateSemester()
            await addStudentEvaluation(formData.professor, formData.subject, currentSemester, formData.answers, session.user.id)
        }

        setIsSubmitting(false)
        setShowSuccessDialog(true)
    }

    const handleSuccessClose = () => {
        setShowSuccessDialog(false)
        setIndexStep(0)
        setFormData(() => initialState(questions))
        router.push("/dashboard")
    }

    const steps = getSteps(formData, errors, handleChange, handleChangeAnswer, questionStages, session)

    // Check if the selected evaluation has already been completed
    useEffect(() => {
        const checkIfCompleted = async () => {
            if (formData.professor && formData.subject && session?.user?.id) {
                const result = await verifyStudentEvaluationData(formData.professor, formData.subject, session.user.id)
                setIsAlreadyCompleted(result.success && result.data)
            }
        }
        checkIfCompleted()
    }, [formData.professor, formData.subject, session])

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
            {/* Consent Dialog */}
            <ConsentDialog onAccept={() => {}} />

            {/* Show warning if already completed */}
            {isAlreadyCompleted && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    <p className="font-bold">✓ Evaluación completada</p>
                    <p>Ya has completado esta evaluación. Puedes ver tus respuestas pero no puedes modificarlas.</p>
                </div>
            )}
            <div className="flex flex-wrap justify-between gap-y-4">
                <HeaderSteps indexStep={indexStep} steps={steps} />
            </div>
            <Card>
                <CardContent className="p-6">
                    <div className="min-h-[300px]">{steps.length > 0 && steps[indexStep]?.component}</div>
                    <FooterSteps
                        steps={steps}
                        indexStep={indexStep}
                        onPrevStep={handlePrevStep}
                        onNextStep={handleNextStep}
                        onSend={handleSend}
                        disabled={isAlreadyCompleted || isSubmitting}
                    />
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center">¿Está seguro de enviar la evaluación?</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className="text-center py-4">
                        Una vez enviada, no podrá modificar sus respuestas.
                    </DialogDescription>
                    <DialogFooter className="sm:justify-center gap-2">
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={confirmSend} disabled={isSubmitting}>
                            {isSubmitting ? "Enviando..." : "Aceptar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Dialog */}
            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center text-green-600">Evaluación enviada</DialogTitle>
                    </DialogHeader>
                    <DialogDescription className="text-center py-4">
                        Su evaluación ha sido enviada exitosamente. Gracias por su participación.
                    </DialogDescription>
                    <DialogFooter className="sm:justify-center">
                        <Button onClick={handleSuccessClose}>Aceptar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}
