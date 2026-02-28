import * as React from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { Role } from "@/lib/@types/types"
import { linksByRole } from "@/lib/routes-by-role"
import { Button } from "../ui/button"
import { signOutSession } from "@/lib/actions/login"

export { linksByRole }

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
                            <SidebarMenu className="font-medium text-lg mt-3 mb-2">Secciones</SidebarMenu>
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
