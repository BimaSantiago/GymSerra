import Parrafos from "../esenciales/Parrafos";
import SubSeccion from "../esenciales/SubSeccion";
import SeccionPequenia from "../esenciales/SeccionPequenia";
import SeccionPequenia2 from "../esenciales/SeccionPequenia2";
import Imagenes from "../esenciales/Imagenes";
import logo from "../../assets/LogoGymSerra.png";
import EventCalendar from "../esenciales/EventCalendar";
import { CarouselDemo } from "../CarouselDemo";

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
  return (
    <section id="nosotros" className="py-10">
      <SubSeccion title="Sobre Nosotros">
        <Parrafos>
          En Gym Serra, nos dedicamos a fomentar la gimnasia artística, el
          parkour y el crossfit, con un enfoque especial en la gimnasia
          artística. Nuestra misión es inspirar a niñas y niños a desarrollar
          sus habilidades físicas y valores personales en un entorno seguro y
          motivador.
        </Parrafos>
      </SubSeccion>

      <SubSeccion title="Historia">
        <SeccionPequenia data={datosHistoria1}>
          <Imagenes
            ruta={logo}
            pie="Nuestra academia en sus inicios"
            alternativo="Logo Gym Serra"
          />
        </SeccionPequenia>
        <SeccionPequenia2 data={datosHistoria2}>
          <Imagenes
            ruta={logo}
            pie="Competencias y crecimiento"
            alternativo="Logo Gym Serra"
          />
        </SeccionPequenia2>
      </SubSeccion>

      <SubSeccion title="Misión">
        <SeccionPequenia data={datosMision}>
          <Imagenes
            ruta={logo}
            pie="Formando futuros campeones"
            alternativo="Logo Gym Serra"
            altura="50px"
          />
        </SeccionPequenia>
      </SubSeccion>

      <SubSeccion title="Visión">
        <SeccionPequenia2 data={datosVision}>
          <Imagenes
            ruta={logo}
            pie="Inspirando excelencia"
            alternativo="Logo Gym Serra"
          />
        </SeccionPequenia2>
      </SubSeccion>
      <CarouselDemo></CarouselDemo>
      <article id="eventos" className="py-10 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Calendario de Eventos
          </h2>
          <EventCalendar />
        </div>
      </article>
    </section>
  );
};

export default Nosotros;
