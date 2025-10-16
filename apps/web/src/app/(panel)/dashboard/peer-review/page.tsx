import type { Metadata } from "next"
import { PeerReviewForm } from "@/ui/dashboard/evaluations/peer-review/peer-review-form"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
    title: "Evaluación entre pares",
    description: "Formulario de evaluación entre pares para estudiantes de la Universidad El Bosque.",
}

const PeerReviewPage = async () => {
    const session = await auth()
    if (!session?.user) {
        redirect("/auth")
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="text-center">
                <PeerReviewForm session={session} />
            </div>
        </div>
    )
}

export default PeerReviewPage
