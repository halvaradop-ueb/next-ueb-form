import { Button } from "@/components/ui/button"
import type { FooterStepsProps } from "@/lib/@types/props"

export const FooterSteps = ({ steps, indexStep, onPrevStep, onNextStep, onSend, disabled }: FooterStepsProps) => {
    return (
        <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={onPrevStep} disabled={indexStep === 0 || disabled}>
                Anterior
            </Button>
            {indexStep < steps.length - 1 ? (
                <Button onClick={onNextStep} disabled={disabled}>
                    Siguiente
                </Button>
            ) : (
                <Button onClick={onSend} disabled={disabled}>
                    {disabled ? "Completada" : "Enviar"}
                </Button>
            )}
        </div>
    )
}
