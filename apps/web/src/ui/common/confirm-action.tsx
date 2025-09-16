import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ConfirmActionProps } from "@/lib/@types/props"
import { set } from "zod"

export const ConfirmAction = ({ title, text, setText, open, setOpen, onDelete }: ConfirmActionProps) => {
    const [textConfirmation, setTextConfirmation] = useState(text)

    const handleDelete = () => {
        setTextConfirmation("")
        onDelete()
        setOpen(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value)
        setTextConfirmation(e.target.value)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-red-600">Confirmar eliminación de {title}</DialogTitle>
                    <DialogDescription asChild>
                        <div className="space-y-4 pt-2">
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
                                <span className="font-medium">¡Atención! Esta acción no se puede deshacer. </span>
                                <span className="mt-1">
                                    Está a punto de eliminar permanentemente una {title} del sistema. Esta acción:
                                </span>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Eliminará la {title} de forma permanente</li>
                                    <li>Podría impactar en reportes históricos</li>
                                </ul>
                            </div>
                            <span>
                                Para confirmar que desea eliminar esta {title}, escriba{" "}
                                <span className="font-bold">eliminar</span> en el campo a continuación:
                            </span>
                            <Input
                                value={textConfirmation}
                                onChange={handleChange}
                                placeholder="Escriba 'eliminar' para confirmar"
                                className="mt-2"
                            />
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={textConfirmation.toLowerCase() !== "eliminar"}
                    >
                        Eliminar {title}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
