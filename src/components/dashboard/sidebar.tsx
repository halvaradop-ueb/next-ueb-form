import * as React from "react";
import Link from "next/link";
import { VersionSwitcher } from "@/components/dashboard/version";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";

const linksByRole = {
    student: [
        {
            title: "Evaluaciones",
            url: "/dashboard/evaluations",
        },
    ],
    proffessor: [
        {
            title: "Evaluaciones",
            url: "/dashboard/evaluations",
        },
    ],
    admin: [
        {
            title: "Estadísticas",
            url: "/dashboard/statistics",
        },
        {
            title: "Historia",
            url: "/dashboard/history",
        },
        {
            title: "Observaciones",
            url: "/dashboard/observations",
        },
        {
            title: "Informes",
            url: "/dashboard/reports",
        },
    ],
};

const data = {
    versions: ["0.1.0"],
    navMain: [
        {
            title: "Panel",
            url: "#",
            items: linksByRole.student,
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <VersionSwitcher versions={data.versions} defaultVersion={data.versions[0]} />
            </SidebarHeader>
            <SidebarContent>
                {data.navMain.map((item) => (
                    <SidebarGroup key={item.title}>
                        <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {item.items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild>
                                            <Link href={item.url}>{item.title}</Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    );
}
