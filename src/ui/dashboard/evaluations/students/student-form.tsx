"use client";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectStep } from "./select-subject-step";
import { FeedbackStep } from "./feedback-step";
import { ProffessorEvaluationStep } from "./proffessor-evaluation-step";
import { Confirmation } from "../confirmation";

const steps = [
    {
        id: "step-1",
        name: "Curso",
        component: <SelectStep />,
    },
    {
        id: "step-2",
        name: "Evaluación",
        component: <ProffessorEvaluationStep />,
    },
    {
        id: "step-3",
        name: "Comentarios",
        component: <FeedbackStep />,
    },
    {
        id: "step-4",
        name: "Confirmación",
        component: <Confirmation />,
    },
];

export const StudentStepForm = () => {
    const [indexStep, setIndexStep] = useState(0);

    const handleNextStep = () => {
        if (indexStep < steps.length - 1) {
            setIndexStep((prev) => prev + 1);
        }
    };

    const handlePrevStep = () => {
        if (indexStep > 0) {
            setIndexStep((prev) => prev - 1);
        }
    };

    return (
        <section className="space-y-8">
            <div className="flex flex-wrap justify-between gap-y-4">
                {steps.map((step, index) => (
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
                            className={`mt-2 text-xs md:text-sm ${
                                indexStep >= index ? "font-medium text-primary" : "text-muted-foreground"
                            }`}
                        >
                            {step.name}
                        </span>
                    </div>
                ))}
            </div>
            <Card>
                <CardContent className="p-6">
                    <div className="min-h-[300px]">{steps[indexStep].component}</div>
                    <div className="mt-8 flex justify-between">
                        <Button variant="outline" onClick={handlePrevStep} disabled={indexStep === 0}>
                            Anterior
                        </Button>
                        {indexStep < steps.length - 1 ? (
                            <Button onClick={handleNextStep}>Siguiente</Button>
                        ) : (
                            <Button>Enviar</Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </section>
    );
};
