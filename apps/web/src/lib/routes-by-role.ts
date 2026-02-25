import { Role } from "@/lib/@types/types"

export const linksByRole: Record<Role, { title: string; url: string }[]> = {
    student: [
        {
            title: "Panel",
            url: "/dashboard",
        },
        {
            title: "Evaluaciones",
            url: "/dashboard/evaluations",
        },
    ],
    professor: [
        {
            title: "Panel",
            url: "/dashboard",
        },
        {
            title: "Evaluaciones",
            url: "/dashboard/evaluations",
        },
        {
            title: "Perfil",
            url: "/profile",
        },
    ],
    admin: [
        {
            title: "Panel",
            url: "/dashboard",
        },
        {
            title: "Etapas",
            url: "/dashboard/stages",
        },
        {
            title: "Materias",
            url: "/dashboard/subjects",
        },
        {
            title: "Cuestionarios",
            url: "/dashboard/quizzes",
        },
        {
            title: "Feedback",
            url: "/dashboard/feedback",
        },
        {
            title: "Informes",
            url: "/dashboard/reports",
        },
        {
            title: "Coevaluación",
            url: "/dashboard/peer-review",
        },
        {
            title: "Gestión de usuarios",
            url: "/dashboard/users",
        },
        {
            title: "Perfil",
            url: "/profile",
        },
    ],
}
