import Image from "next/image"
import logo1 from "@/assets/MGOP_EGDP.png"
import logo2 from "@/assets/GDPCirclo.png"

const DashboardPage = () => {
    return (
        <section className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <figure className="grid items-center gap-6 mb-6 lg:grid-cols-[1fr_auto]">
                <Image src={logo1} className="object-cover" priority alt="Logo de la Universidad El Bosque" draggable="false" />
                <Image src={logo2} className="w-40 mx-auto object-cover" priority alt="Logo secundario" draggable="false" />
            </figure>
            <div className="mb-6">
                <h1 className="text-4xl font-extrabold leading-tight">Sistema de Evaluación Docente</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Bienvenido al Sistema de Información para la Evaluación Docente, basado en el modelo de evaluación 360 grados
                    para los programas de posgrado (especializaciones y maestrías) de la Facultad de Ingeniería en Gerencia de
                    Proyectos de la Universidad El Bosque.
                </p>
            </div>
        </section>
    )
}

export default DashboardPage
