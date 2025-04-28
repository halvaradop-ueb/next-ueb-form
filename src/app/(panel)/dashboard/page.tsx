import Image from "next/image"
import logo from "@/assets/ueb.png"

const DashboardPage = () => {
    return (
        <section className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <Image
                className="w-10/12 max-w-sm rounded-lg"
                src={logo}
                alt="Logo de la Universidad El Bosque"
                priority
                draggable="false"
            />
            <div className="mb-6">
                <h1 className="text-4xl font-extrabold leading-tight">Sistema de Evaluación Docente</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Bienvenido al sistema de evaluación docente para el programa de gerencia de proyectos en postgrados de la
                    Universidad El Bosque.
                </p>
            </div>
        </section>
    )
}

export default DashboardPage
