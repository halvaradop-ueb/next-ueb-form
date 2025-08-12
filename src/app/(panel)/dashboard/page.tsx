import Image from "next/image"
import logo from "@/assets/ueb.png"
import Facul from "@/assets/FacultadaInge.png"
import MGOP from "@/assets/BANNERMGOPEGDP.png"
import PMI from "@/assets/PMI803GACSeal3-RGB_si.jpg"

const DashboardPage = () => {
    return (
        <section className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <div className="flex flex-row items-center justify-center gap-4 mb-6">
                <Image
                    className="w-200/200 max-w-sm rounded-lg"
                    src={Facul}
                    alt="Faculogo"
                    priority
                    draggable="false"
                />
            </div>
            <div className="mb-6">
                <h1 className="text-4xl font-extrabold leading-tight">Sistema de Evaluación Docente</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Bienvenido al sistema de evaluación docente basado en el modelo 360°, diseñado para los programas de maestría y especialización en 
                    Gerencia de Proyectos de la facultad de ingeniería de la Universidad El Bosque.
                </p>
            </div>

            <div className="flex flex-row items-center justify-center gap-6 mt-10">
                <Image
                    className="w-120 h-auto"
                    src={MGOP}
                    alt="Logo MGOP"
                    draggable="false"
                />
                <Image
                    className="w-30 h-auto"
                    src={PMI}
                    alt="Logo PMI"
                    draggable="false"
                />
            </div>
        </section>
    )
}

export default DashboardPage