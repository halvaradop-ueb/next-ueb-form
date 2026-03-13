import { ReactElement } from "react"
import { render } from "@testing-library/react"
import { SidebarProvider } from "@/components/ui/sidebar"

export const renderWithSidebar = (ui: ReactElement, defaultOpen = true) => {
    return render(<SidebarProvider defaultOpen={defaultOpen}>{ui}</SidebarProvider>)
}
