import type { Metadata } from "next"
import { Profile } from "@/ui/profile/profile"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
    title: "Mi Perfil",
    description: "Gestión de perfil para estudiantes y docentes de la Universidad El Bosque.",
}

export const ProfilePage = async () => {
    const session = await auth()
    if (!session) {
        redirect("/auth")
    }
    return <Profile session={session} />
}

export default ProfilePage
