import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "lucide-react";
import { Calendar, Award, Users } from "lucide-react";
import { Button } from "../ui/button";

// Datos de ejemplo para noticias
const EXAMPLE_NEWS = [
  {
    id: 1,
    title: "¡Segundo lugar en el Nacional de Gimnasia Artística!",
    date: new Date("2025-10-15"),
    type: "gimnasia-artistica",
    content:
      "Nuestras gimnastas brillaron en el Campeonato Nacional en Xalapa, Veracruz, obteniendo el segundo lugar en la categoría juvenil. ¡Un gran logro para Gym Serra!",
    participants: 12,
    location: "Xalapa, Veracruz",
  },
  {
    id: 2,
    title: "Taller de Parkour: Nuevos récords en saltos",
    date: new Date("2025-10-10"),
    type: "parkour",
    content:
      "El pasado taller de parkour atrajo a jóvenes entusiastas que lograron superar récords personales en técnicas de salto. ¡El equipo está listo para la próxima competencia estatal!",
    participants: 8,
    location: "Gym Serra - Área Exterior",
  },
  {
    id: 3,
    title: "Clase abierta de Gimnasia Artística para nuevos talentos",
    date: new Date("2025-09-20"),
    type: "gimnasia-artistica",
    content:
      "Organizamos una clase abierta para niñas y niños interesados en la gimnasia artística. Más de 20 participantes descubrieron la magia de este deporte.",
    participants: 20,
    location: "Sala Principal - Gym Serra",
  },
  {
    id: 4,
    title: "Crossfit: Desafío de fuerza en Gym Serra",
    date: new Date("2025-09-10"),
    type: "crossfit",
    content:
      "Nuestra comunidad de crossfit participó en un desafío interno de fuerza, demostrando gran compromiso y trabajo en equipo. ¡Felicidades a todos los atletas!",
    participants: 15,
    location: "Zona Funcional - Gym Serra",
  },
  {
    id: 5,
    title: "Preparativos para la Copa Regional de Gimnasia",
    date: new Date("2025-08-25"),
    type: "gimnasia-artistica",
    content:
      "Nuestras gimnastas están entrenando intensamente para la Copa Regional en Querétaro. ¡Sigue nuestras redes para actualizaciones en vivo!",
    participants: 10,
    location: "Querétaro",
  },
];

const Noticias = () => {
  const getBadgeColor = (type: string) => {
    switch (type) {
      case "gimnasia-artistica":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "parkour":
        return "bg-green-100 text-green-800 border-green-200";
      case "crossfit":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <section id="noticias" className="py-10 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-sans font-bold text-center text-gray-800 mb-8">
          Últimas Noticias
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXAMPLE_NEWS.map((news) => (
            <Card key={news.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{news.title}</span>
                  <Badge className={`border-2 ${getBadgeColor(news.type)}`}>
                    {news.type === "gimnasia-artistica"
                      ? "Gimnasia Artística"
                      : news.type === "parkour"
                      ? "Parkour"
                      : "Crossfit"}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {news.date.toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">{news.content}</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{news.participants} participantes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span>{news.location}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button className="flex mx-auto my-6  bg-gray-800 hover:bg-gray-600 text-white font-medium">
          Ver mas noticias
        </Button>
      </div>
    </section>
  );
};

export default Noticias;
