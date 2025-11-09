import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Dumbbell, Search } from "lucide-react";
import EventCalendar from "../esenciales/EventCalendar";

interface Noticia {
  idnoticias: number;
  titulo: string;
  descricpion: string;
  fecha_publicacion: string;
  imagen: string;
  deporte: string;
  ubicacion: string;
  fecha_inicio: string;
  fecha_fin: string;
}

const NoticiasPublicas = () => {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  // 🔹 Obtener noticias públicas
  const fetchNoticias = async () => {
    const res = await fetch(
      `http://localhost/GymSerra/public/api/noticias.php?action=listExtended&page=${page}&limit=${limit}&search=${search}`
    );
    const data = await res.json();
    setNoticias(data.noticias || []);
    setTotal(data.total || 0);
  };

  useEffect(() => {
    fetchNoticias();
  }, [page, search]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Noticias y Eventos
          </h1>
          <p className="text-gray-600">
            Mantente informado sobre los próximos eventos, competencias y
            actividades deportivas del gimnasio.
          </p>
        </div>
        <EventCalendar></EventCalendar>
        {/* Barra de búsqueda */}
        <div className="flex justify-center mb-10">
          <div className="relative w-full max-w-md">
            <Input
              placeholder="Buscar por título, descripción o deporte..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 pr-4 py-2 rounded-lg shadow-md border border-gray-200 focus:ring-2 focus:ring-gray-400"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Grid de noticias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {noticias.length === 0 ? (
            <p className="text-center text-gray-500 col-span-full">
              No se encontraron noticias.
            </p>
          ) : (
            noticias.map((n) => (
              <Card
                key={n.idnoticias}
                className="shadow-lg hover:shadow-2xl border border-gray-200 rounded-xl overflow-hidden bg-white transition-transform hover:-translate-y-1"
              >
                <CardHeader className="p-0">
                  <img
                    src={`http://localhost/GymSerra/public/${n.imagen}`}
                    alt={n.titulo}
                    className="h-52 w-full object-cover"
                  />
                </CardHeader>

                <CardContent className="p-5">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {n.titulo}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {n.descricpion}
                  </p>

                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-gray-500" />
                      <span>{n.deporte}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{n.ubicacion}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>
                        {new Date(n.fecha_inicio).toLocaleDateString()} -{" "}
                        {new Date(n.fecha_fin).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between items-center px-5 py-3 border-t text-xs text-gray-500">
                  <span>
                    Publicado:{" "}
                    {new Date(n.fecha_publicacion).toLocaleDateString()}
                  </span>
                </CardFooter>
              </Card>
            ))
          )}
        </div>

        {/* Paginación */}
        {total > limit && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <Button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg"
            >
              Anterior
            </Button>
            <span className="text-gray-700">
              Página {page} de {totalPages}
            </span>
            <Button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg"
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticiasPublicas;
