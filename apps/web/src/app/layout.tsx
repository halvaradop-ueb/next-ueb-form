import type { Metadata } from "next"
import { PropsWithChildren } from "react"
import { Geist } from "next/font/google"
import "@/ui/globals.css"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: {
        template: "%s | Universidad El Bosque",
        default: "Evaluación Docente",
    },
    description: "Evaluación Docente",
}

export default async function RootLayout({ children }: Readonly<PropsWithChildren>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} antialiased`}>{children}</body>
        </html>
    )
}
