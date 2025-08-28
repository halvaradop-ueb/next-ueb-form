export const Confirmation = () => {
    return (
        <section className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Confirmación</h2>
                <p className="text-muted-foreground">Por favor, revise su información antes de enviar</p>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm">
                    Al hacer clic en enviar, usted acepta nuestros términos y condiciones y confirma que toda la
                    información proporcionada es correcta.
                </p>
            </div>
        </section>
    )
}
