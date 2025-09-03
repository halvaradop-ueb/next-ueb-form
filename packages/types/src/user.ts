export interface User {
    id: string
    first_name: string
    last_name: string
    email: string
    password: string
    role: "student" | "professor" | "admin"
    created_at: string
    status: boolean
    address: string
    phone: string
    photo?: string
}
