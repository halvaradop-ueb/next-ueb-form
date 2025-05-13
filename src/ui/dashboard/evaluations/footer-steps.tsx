import { Button } from "@/components/ui/button"
import type { FooterStepsProps } from "@/lib/@types/props"

export const FooterSteps = ({ steps, indexStep, onPrevStep, onNextStep, onSend }: FooterStepsProps) => {
    return (
        <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={onPrevStep} disabled={indexStep === 0}>
                Anterior
            </Button>
            {indexStep < steps.length - 1 ? (
                <Button onClick={onNextStep}>Siguiente</Button>
            ) : (
                <Button onClick={onSend}>Enviar</Button>
            )}
        </div>
    )
}
