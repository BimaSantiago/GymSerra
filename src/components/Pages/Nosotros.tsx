import Parrafos from "../layout/Parrafos";
import SubSeccion from "../layout/SubSeccion";
import SeccionPequenia from "../layout/SeccionPequenia";
import SeccionPequenia2 from "../layout/SeccionPequenia2";
import Imagenes from "../layout/Imagenes";
import Imagen1 from "../../assets/img1familia.svg";
import Imagen2 from "../../assets/img1historia.svg";
import Imagen3 from "../../assets/img1nosostros.svg";
import Imagen4 from "../../assets/img1pilares.svg";
import Imagen6 from "../../assets/img2historia.svg";

import { CarouselDemo } from "../layout/CarouselDemo";
import ImageGallery from "../layout/ImageGallery";
import VideoGallery from "../layout/VideoGallery";

import {
  Heart,
  Users,
  ShieldCheck,
  Dumbbell,
  Target,
  Sparkles,
  Handshake,
} from "lucide-react";

const Nosotros = () => {
  const datosHistoria1: string[] = [
    "Academia Gym Serra inició con sus actividades el 15 de mayo de 2018 con muy poco material y equipamiento, pero con muchas ganas de dar a conocer la gimnasia artística en el municipio; en ese entonces entrenábamos en un espacio muy pequeño y cada vez más se iba incrementando el número de alumnas en esta disciplina.",
    "Nuestro propósito siempre fue hacer que las pequeñas que practicaran este deporte, se divirtieran y pasaran un buen rato en cada clase de modo que esperaran con ansia el siguiente entrenamiento y así fue, unas niñas llegaban y otras se iban hasta que el espacio nos fue quedando más pequeño y se decidió cambiar de lugar a uno más grande sobre la calle, Lázaro Cárdenas.",
    "En este espacio estuvimos muy poco ya que se vino la Pandemia y tuvimos que cerrar nuestras puertas debido a la contingencia sanitaria, sin embargo, para ese entonces teníamos ya algunos meses afiliados a la Asociación de Gimnasios Unidos del Estado de México (GUEM) y nos encontrábamos afiliados a la Federación Mexicana de Gimnasia. Antes de cerrar ya algunas niñas habían ido a competir de manera formal en eventos oficiales.",
  ];

  const datosHistoria2: string[] = [
    "Durante la pandemia se daban clases en línea, pero la respuesta no fue tan favorable pues no muchas niñas se conectaban a las clases y decidimos parar por completo.",
    "Una vez levantada la contingencia se reabrieron las puertas de la academia y con ella iniciaba una nueva disciplina; El parkour, una actividad destinada para niñas y niños que disfrutaran correr, saltar y pasarla bien, consiste en trazar recorridos eficientes para poder llegar de un punto a otro de la manera más rápida posible y para los papás, se inició con las clases de crossfit y funcional para que hicieran actividad mientras esperaban a sus hijos e hijas.",
    "Actualmente en gimnasia se ha participado en eventos tanto estatales, regionales y copas en diversos lugares de la república como; Puebla, Toluca, Querétaro, Aguascalientes, Cuernavaca entre otros y en parkour se tienen ya niños afiliados ante la misma Federación y han participado en eventos estatales y nacionales, esperando se pueda participar en más eventos como estos y poder lograr grandes resultados como en nuestro ultimo Nacional, llevado a cabo en Xalapa, Veracruz obteniendo el segundo Lugar.",
  ];

  const datosMision: string[] = [
    "Formar integralmente a niñas y niños de 3 a 15 años a través de la gimnasia artística y el parkour, fomentando el desarrollo de sus habilidades físicas, emocionales y sociales. Buscamos que cada entrenamiento sea una oportunidad para fortalecer su carácter, disciplina, trabajo en equipo y respeto, construyendo así personas seguras, responsables y con valores sólidos.",
  ];

  const datosVision: string[] = [
    "Ser una academia de gimnasia artística de mayor referencia en nuestro municipio, reconocido por ofrecer un espacio seguro, motivador y de excelencia, donde niñas y niños desarrollen no solo su talento deportivo, sino también su confianza, resiliencia y amor por un estilo de vida saludable, contribuyendo a formar ciudadanos íntegros y comprometidos con su entorno.",
  ];

  const valores = [
    {
      titulo: "Disciplina",
      descripcion:
        "Fomentamos la constancia y el compromiso en cada entrenamiento para alcanzar metas personales y deportivas.",
      icono: <Target className="h-8 w-8 text-blue-600" />,
    },
    {
      titulo: "Respeto",
      descripcion:
        "Valoramos a cada niño, niña, entrenador y familia, creando un ambiente seguro e inclusivo.",
      icono: <ShieldCheck className="h-8 w-8 text-blue-600" />,
    },
    {
      titulo: "Perseverancia",
      descripcion:
        "Enseñamos a no rendirse ante los retos y a ver cada caída como una oportunidad de aprender y mejorar.",
      icono: <Dumbbell className="h-8 w-8 text-blue-600" />,
    },
    {
      titulo: "Trabajo en Equipo",
      descripcion:
        "Promovemos la colaboración y el apoyo mutuo entre alumnos, construyendo una comunidad unida.",
      icono: <Users className="h-8 w-8 text-blue-600" />,
    },
    {
      titulo: "Responsabilidad",
      descripcion:
        "Impulsamos que niñas y niños tomen conciencia de su esfuerzo, cuidado de su cuerpo y cumplimiento de compromisos.",
      icono: <Handshake className="h-8 w-8 text-blue-600" />,
    },
    {
      titulo: "Confianza",
      descripcion:
        "Ayudamos a que desarrollen seguridad en sí mismos, celebrando cada logro, por pequeño que parezca.",
      icono: <Heart className="h-8 w-8 text-blue-600" />,
    },
    {
      titulo: "Pasión por el Deporte",
      descripcion:
        "Inspiramos amor por el deporte y un estilo de vida saludable que puedan mantener a lo largo de su vida.",
      icono: <Sparkles className="h-8 w-8 text-blue-600" />,
    },
  ];

  return (
    <div className="bg-white min-h-screen text-gray-900 overflow-x-hidden">
      {/* 2. Sobre Nosotros */}
      <section className="py-16 bg-white">
        <SubSeccion title="¿Quiénes Somos?">
          <Parrafos>
            En <span className="font-bold text-blue-600">Gym Serra</span>, nos
            dedicamos a fomentar la gimnasia artística, el parkour y el
            crossfit, con un enfoque especial en la gimnasia artística. Nuestra
            misión es inspirar a niñas y niños a desarrollar sus habilidades
            físicas y valores personales en un entorno seguro y motivador.
          </Parrafos>
        </SubSeccion>
      </section>

      {/* 3. Carousel */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <CarouselDemo
            items={[
              { src: Imagen4, alt: "Instalaciones Gym Serra" },
              { src: Imagen6, alt: "Clases de Gimnasia" },
              { src: Imagen4, alt: "Entrenamiento Funcional" },
            ]}
            showThumbnails
            aspect="video"
            autoPlayDelay={3500}
          />
        </div>
      </section>

      {/* 4. Historia */}
      <section className="py-16 bg-white">
        <SubSeccion title="Nuestra Historia">
          <div className="space-y-12">
            <SeccionPequenia data={datosHistoria1}>
              <Imagenes
                ruta={Imagen4}
                pie="Nuestra academia en sus inicios"
                alternativo="Inicios Gym Serra"
                className="rounded-2xl shadow-lg"
              />
            </SeccionPequenia>
            <SeccionPequenia2 data={datosHistoria2}>
              <Imagenes
                ruta={Imagen1}
                pie="Competencias y crecimiento"
                alternativo="Crecimiento Gym Serra"
                className="rounded-2xl shadow-lg"
              />
            </SeccionPequenia2>
          </div>
        </SubSeccion>
      </section>

      {/* 5. Image Gallery */}
      <ImageGallery />

      {/* 6. Misión y Visión */}
      <section className="py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="space-y-16">
          <SubSeccion title="Nuestra Misión">
            <SeccionPequenia data={datosMision}>
              <Imagenes
                ruta={Imagen2}
                pie="Formando futuros campeones"
                alternativo="Misión Gym Serra"
                altura="50px"
                className="max-h-60 rounded-2xl shadow-md"
              />
            </SeccionPequenia>
          </SubSeccion>

          <SubSeccion title="Nuestra Visión">
            <SeccionPequenia2 data={datosVision}>
              <Imagenes
                ruta={Imagen3}
                pie="Inspirando excelencia"
                alternativo="Visión Gym Serra"
                className="max-h-60 rounded-2xl shadow-md"
              />
            </SeccionPequenia2>
          </SubSeccion>
        </div>
      </section>

      {/* Valores (Optional: kept as it was in original but styled) */}
      <section className="py-16 bg-white">
        <SubSeccion title="Nuestros Valores">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 px-6 max-w-7xl mx-auto">
            {valores.map((valor, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 flex flex-col items-center text-center group"
              >
                <div className="mb-5 bg-blue-50 p-4 rounded-full group-hover:bg-blue-100 transition-colors">
                  {valor.icono}
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  {valor.titulo}
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {valor.descripcion}
                </p>
              </div>
            ))}
          </div>
        </SubSeccion>
      </section>

      {/* 7. Video Gallery */}
      <VideoGallery />
    </div>
  );
};

export default Nosotros;
