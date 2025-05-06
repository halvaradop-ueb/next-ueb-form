import type { MouseEventHandler } from "react"
import type { Question, SubjectAssignmentWithProfessorService, SubjectService } from "./services"
import type { ProfessorFormState, StudentFormState } from "./types"

export interface ChildrenProps {
    children: React.ReactNode
}

export interface SelectSubjectStepProps<T extends object = StudentFormState> {
    formData: T
    setFormData: (key: keyof T, value: any) => void
}

export interface EvaluationStepProps<T extends object = StudentFormState> {
    questions: Question[]
    formData: T
    setFormData: (key: keyof T, value: any) => void
    onChangeAnswer: (key: string, value: any) => void
}

export interface RenderQuestionProps {
    question: Question
    formData: StudentFormState
    setFormData: (key: keyof StudentFormState, value: any) => void
    onChange: (key: string, value: any) => void
}

export interface HeaderStepsProps {
    indexStep: number
    steps: Array<{
        id: string
        name: string
        component: React.ReactNode
    }>
}

export interface FooterStepsProps {
    indexStep: number
    onNextStep: MouseEventHandler
    onPrevStep: MouseEventHandler
    onSend: () => void
    steps: Array<{
        id: string
        name: string
        component: React.ReactNode
    }>
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
