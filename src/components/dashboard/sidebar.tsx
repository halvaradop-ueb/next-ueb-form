import * as React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { VersionSwitcher } from "@/components/dashboard/version"
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
        return null
    }
    const routes = linksByRole[role]

    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <VersionSwitcher versions={data.versions} defaultVersion={data.versions[0]} />
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {routes.map((item) => (
                                <SidebarMenuItem key={item.title}>
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
