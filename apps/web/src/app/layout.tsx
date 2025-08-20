import { Geist } from "next/font/google"
import { ChildrenProps } from "@/lib/@types/props"
import "@/ui/globals.css"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

export default async function RootLayout({ children }: ChildrenProps) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} antialiased`}>{children}</body>
        </html>
    )
}
