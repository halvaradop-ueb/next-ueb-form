import Image from "next/image"
import logo from "@/assets/ueb.png"
import Facul from "@/assets/FacultadaInge.png"

const DashboardPage = () => {
    return (
        <section className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <div className="flex flex-row items-center justify-center gap-4 mb-6">
            <Image
                className="w-10/12 max-w-sm rounded-lg"
                src={logo}
                alt="Logo de la Universidad El Bosque"
                priority
                draggable="false"
            />
            <Image
                className="w-10/12 max-w-sm rounded-lg"
                src={Facul}
                alt="Faculogo"
                priority
                draggable="false"
             />
            </div>
            <div className="mb-6">
                <h1 className="text-4xl font-extrabold leading-tight">Sistema de Evaluación Docente</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Bienvenido al sistema de evaluación docente basado en el modelo 360°, diseñado para los programas de maestria y especialización en 
                    Gerencia de Proyectos de la facultad de ingenieria de la Universidad El Bosque.
                </p>
            </div>
        </section>
    )
}

export default DashboardPage
