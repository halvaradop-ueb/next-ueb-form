/**
 * @deprecated
 */
export interface QuestionService {
    id: string;
    title: string;
    description?: string;
    question_type: "single_choice" | "multiple_choice" | "text" | "numeric";
    required: boolean;
    target_audience: "student" | "professor";
    stage_id: string;
}
/**
 * @deprecated
 */
export interface UserService {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role: "student" | "professor" | "admin";
    created_at: string;
    status: boolean;
    address: string;
    phone: string;
    photo?: string;
}
//# sourceMappingURL=index.d.ts.map