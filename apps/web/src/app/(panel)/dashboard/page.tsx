import Image from 'next/image';
import logo1 from '@/assets/MGOP_EGDP.png';
import logo2 from '@/assets/GDPCirclo.png';
const DashboardPage = () => {
  return (
    <section className="flex flex-col items-center justify-center px-4 py-8 text-center">
      {/* Contenedor de logos en fila */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <Image
          priority
          alt="Logo de la Universidad El Bosque"
          className="w-100 max-w-xs rounded-lg"
          draggable="false"
          src={logo1}
        />
        <Image
          priority
          alt="Logo secundario"
          className="w-20 max-w-xs rounded-lg"
          draggable="false"
          src={logo2}
        />
      </div>

      <div className="mb-6">
        <h1 className="text-4xl font-extrabold leading-tight">
          Sistema de Evaluación Docente
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Bienvenido al Sistema de Información para la Evaluación Docente,
          basado en el modelo de evaluación 360 grados para los programas de
          posgrado (especializaciones y maestrías) de la Facultad de Ingeniería
          en Gerencia de Proyectos de la Universidad El Bosque.
        </p>
      </div>
    </section>
  );
};

export default DashboardPage;
