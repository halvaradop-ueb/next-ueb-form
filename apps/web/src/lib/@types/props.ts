import type { Dispatch, MouseEventHandler, SetStateAction } from "react"
import type { Question, SubjectAssignmentWithProfessorService, SubjectService } from "./services"
import type { FormSchema, Step, StudentFormState } from "./types"
import type { Session } from "next-auth"

export interface ChildrenProps {
    children: React.ReactNode
}

export interface SelectSubjectStepProps<T extends object = StudentFormState> {
    formData: T
    errors: Record<string, string>
    setFormData: (key: keyof T, value: any) => void
}

export interface EvaluationStepProps<T extends object = FormSchema> {
    questions: Question[]
    formData: T
    errors: Record<string, string>
    setFormData: (key: keyof T, value: any) => void
    onChangeAnswer: (key: string, value: any) => void
}

export interface RenderQuestionProps<T extends object = FormSchema> {
    question: Question
    formData: T
    errors: Record<string, string>
    setFormData: (key: keyof T, value: any) => void
    onChange: (key: string, value: any) => void
}

export interface HeaderStepsProps {
    indexStep: number
    steps: Array<{
        id: string
        name: string
        component: React.ReactNode
        // schema: z.ZodObject<any>
    }>
}

export interface FooterStepsProps {
    indexStep: number
    steps: Step[]
    onNextStep: MouseEventHandler
    onPrevStep: MouseEventHandler
    onSend: () => void
}

export interface FeedbackStepProps {
    formData: StudentFormState
    setFormData: (key: keyof StudentFormState, value: any) => void
}

export interface SubjectAssignmentProps {
    subject: SubjectService
    assignments: SubjectAssignmentWithProfessorService[]
    expandedSubjects: string[]
    setExpandedSubjects: (subjectId: string) => void
    onCreateAssignment: (subjectId: string) => void
    onEditSubject: (subjectId: string) => void
    onDeleteSubject: (subjectId: string) => void
    onDeleteAssignment: (assignmentId: string) => void
}

export interface ConfirmActionProps {
    title: string
    text: string
    setText: Dispatch<SetStateAction<string>>
    open: boolean
    setOpen: Dispatch<SetStateAction<boolean>>
    onDelete: () => void
}

export interface PeerReviewFormProps {
    session: Session
}

export interface ProfileProps {
    session: Session
}
