import Image from "next/image"
import { PropsWithChildren } from "react"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/dashboard/sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import logoUEB from "@/assets/ueb.png"

const PanelLayout = async ({ children }: PropsWithChildren) => {
    return (
        <section>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Image
                            className="object-cover"
                            width={140}
                            src={logoUEB}
                            alt="Logo Universidad El Bosque"
                            priority
                            draggable="false"
                        />
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
                </SidebarInset>
            </SidebarProvider>
        </section>
    )
}

export default PanelLayout
