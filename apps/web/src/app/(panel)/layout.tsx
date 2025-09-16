import { SessionProvider } from "next-auth/react"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/dashboard/sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ChildrenProps } from "@/lib/@types/props"
import { auth } from "@/lib/auth"
import logoUEB from "@/assets/ueb.png"
import Image from "next/image"

const PanelLayout = async ({ children }: ChildrenProps) => {
    const session = await auth()
    return (
        <SessionProvider session={session}>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Image className="object-cover" width={140} src={logoUEB} alt="Logo Universidad El Bosque" priority draggable="false" />
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
                </SidebarInset>
            </SidebarProvider>
        </SessionProvider>
    )
}

export default PanelLayout
