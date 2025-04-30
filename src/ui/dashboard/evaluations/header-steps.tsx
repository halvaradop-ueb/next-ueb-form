import { HeaderStepsProps } from "@/lib/@types/props"
import { CheckCircle2 } from "lucide-react"

export const HeaderSteps = ({ steps, indexStep }: HeaderStepsProps) => {
    return steps.map((step, index) => (
        <div key={step.id} className="flex flex-col items-center">
            <div className="flex items-center">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        indexStep >= index
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground text-muted-foreground"
                    }`}
                >
                    {indexStep > index ? <CheckCircle2 className="h-6 w-6" /> : <span>{index + 1}</span>}
                </div>
                {index < steps.length - 1 && (
                    <div className={`h-1 w-6 md:w-16 ${indexStep > index ? "bg-primary" : "bg-muted"}`} />
                )}
            </div>
            <span
                className={`mt-2 text-xs md:text-sm ${indexStep >= index ? "font-medium text-primary" : "text-muted-foreground"}`}
            >
                {step.name}
            </span>
        </div>
    ))
}
