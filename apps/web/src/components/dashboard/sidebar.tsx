import * as React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { Role } from "@/lib/@types/types"
import { Button } from "../ui/button"
import { signOutSession } from "@/lib/actions/login"

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

const data = {
    versions: ["0.1.0"],
}

export const AppSidebar = async ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
    const session = await auth()
    const role = session?.user?.role as Role
    if (!session || !role) {
        redirect("/auth")
    }
    const routes = linksByRole[role]

    return (
        <Sidebar {...props}>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenu className="font-medium text-lg mt-3 mb-2">
                                Secciones
                            </SidebarMenu>
                            {routes.map((item, index) => (
                                <SidebarMenuItem key={index}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>{item.title}</Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                        <form action={signOutSession}>
                            <Button className="w-full mt-8">Salir de sesión</Button>
                        </form>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}
