"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConsentDialogProps {
    onAccept: () => void
}

export const ConsentDialog = ({ onAccept }: ConsentDialogProps) => {
    const [isOpen, setIsOpen] = useState(true)

    const handleAccept = () => {
        setIsOpen(false)
        onAccept()
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-center">Aviso de Protección de Datos Personales</DialogTitle>
                </DialogHeader>
                <DialogDescription asChild>
                    <div className="text-sm text-gray-700 space-y-4 py-4">
                        <p>
                            En cumplimiento de la <strong>Ley 1581 de 2012</strong> y el <strong>Decreto 1377 de 2013</strong>{" "}
                            sobre protección de datos personales en Colombia, informamos que la información recolectada a través
                            del presente cuestionario será utilizada únicamente con fines académicos y educativos, en el marco del
                            proyecto de investigación desarrollado por los estudiantes.
                        </p>

                        <div className="space-y-2">
                            <p>
                                • Las respuestas proporcionadas serán tratadas de manera <strong>confidencial</strong>.
                            </p>
                            <p>
                                • Los correos electrónicos, nombres y cualquier dato que permita la identificación personal serán{" "}
                                <strong>anonimizados</strong>, garantizando que los profesores u otros terceros no podrán asociar
                                las respuestas con una persona específica.
                            </p>
                            <p>
                                • La participación en este instrumento es <strong>voluntaria</strong> y la información será
                                utilizada exclusivamente para el análisis estadístico y académico del estudio.
                            </p>
                        </div>

                        <p className="font-medium text-center bg-blue-50 p-3 rounded-lg border border-blue-200">
                            Al diligenciar el cuestionario, el participante acepta de manera informada el uso de sus datos bajo
                            las condiciones anteriormente descritas.
                        </p>
                    </div>
                </DialogDescription>
                <DialogFooter className="sm:justify-center">
                    <Button onClick={handleAccept} className="w-full sm:w-auto px-8">
                        Acepto y deseo continuar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
