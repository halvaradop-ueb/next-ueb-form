import { PeerReviewForm } from "@/ui/dashboard/evaluations/peer-review/peer-review-form"

const PeerReviewPage = () => {
    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="text-center">
                <PeerReviewForm />
            </div>
        </div>
    )
}

export default PeerReviewPage
