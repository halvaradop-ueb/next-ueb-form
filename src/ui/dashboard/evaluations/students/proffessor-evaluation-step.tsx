import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const evaluationQuestions = [
    {
        id: "teachingQuality",
        question: "¿Cómo calificarías la calidad general de la enseñanza?",
        description:
            "Considera la capacidad del profesor para explicar conceptos complejos y captar la atención de los estudiantes.",
    },
    {
        id: "communication",
        question: "¿Qué tan efectiva fue la comunicación del profesor?",
        description:
            "Considera la claridad de las explicaciones, la capacidad de responder preguntas y las habilidades de presentación.",
    },
    {
        id: "availability",
        question: "¿Qué tan disponible estuvo el profesor fuera de clase?",
        description:
            "Considera las horas de oficina, la capacidad de respuesta por correo electrónico y la disposición para ayudar.",
    },
    {
        id: "fairness",
        question: "¿Qué tan justo fue el profesor en la calificación y evaluación?",
        description: "Considera la consistencia, la transparencia y la alineación con el contenido del curso.",
    },
    {
        id: "knowledge",
        question: "¿Qué tan conocedor era el profesor sobre el tema?",
        description: "Considera la experiencia, la información actualizada y la capacidad de responder preguntas.",
    },
    {
        id: "organization",
        question: "¿Qué tan bien organizado estuvo el curso?",
        description: "Considera la estructura, la planificación y la claridad de las expectativas.",
    },
];

const range = Array.from({ length: 10 }).map((_, i) => i + 1);

export const ProffessorEvaluationStep = () => {
    return (
        <section>
            <div>
                <h2 className="text-2xl font-bold">Selección de Curso</h2>
                <p className="text-muted-foreground">Selecciona tu materia y profesor</p>
            </div>
            <form className="mt-6 space-y-4">
                {evaluationQuestions.map(({ id, description, question }) => (
                    <Card key={id}>
                        <CardContent className="p-2 space-y-2">
                            <Label htmlFor={id}>{question}</Label>
                            <p className="text-sm text-muted-foreground">{description}</p>
                            <RadioGroup className="pt-2 flex justify-between" id={id}>
                                {range.map((value) => (
                                    <div className="flex items-center flex-col gap-y-1" key={value}>
                                        <RadioGroupItem className="peer sr-only" value={value.toString()} id={`${id}-${value}`} />
                                        <Label
                                            className="flex size-8 cursor-pointer items-center justify-center text-xs rounded-full border-2 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                                            htmlFor={`${id}-${value}`}
                                        >
                                            {value}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </CardContent>
                    </Card>
                ))}
            </form>
        </section>
    );
};
