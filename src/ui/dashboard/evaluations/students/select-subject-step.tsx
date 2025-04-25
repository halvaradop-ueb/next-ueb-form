import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

const proffessors = [
    { value: "1", name: "Dr. García" },
    { value: "2", name: "Prof. Martínez" },
    { value: "3", name: "Dr. López" },
]

const subjects = [
    { value: "1", name: "Matemáticas" },
    { value: "2", name: "Informática" },
    { value: "3", name: "Física" },
]

export const SelectStep = () => {
    return (
        <section>
            <div>
                <h2 className="text-2xl font-bold">Seleccion de Docente y Materia</h2>
                <p className="text-muted-foreground">
                    Por favor selecciona al docente y materia que vas a realizar la evaluación docente
                </p>
            </div>
            <form className="mt-6 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="subject">Selecciona la materia</Label>
                    <Select>
                        <SelectTrigger className="w-full" id="subject">
                            <SelectValue placeholder="Materia" />
                        </SelectTrigger>
                        <SelectContent>
                            {subjects.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="proffessor">Selecciona al docente</Label>
                    <Select>
                        <SelectTrigger className="w-full" id="proffessor">
                            <SelectValue placeholder="Docente" />
                        </SelectTrigger>
                        <SelectContent>
                            {proffessors.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </form>
        </section>
    )
}
