/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import type { EventClickArg, ViewApi } from "@fullcalendar/core";

import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Calendar,
  Dumbbell,
  Search,
  BookOpen,
  MapPin,
  Trophy,
  Star,
  Award,
  Medal,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";

// Imports of local assets
import img1familia from "../../assets/img1familia.svg";
import img1nosostros from "../../assets/img1nosostros.svg";
import img1programas from "../../assets/img1programas.svg";
import img1somos from "../../assets/img1somos.svg";
import img2nosostros from "../../assets/img2nosostros.svg";
import img2programas from "../../assets/img2programas.svg";
import img2somos from "../../assets/img2somos.svg";
import img3programas from "../../assets/img3programas.svg";
import img3somos from "../../assets/img3somos.svg";
import img1pilares from "../../assets/img1pilares.svg";

// Importamos estilos
import "./noticias.css";

const API_BASE = "https://academiagymserra.garzas.store";

// Interfaces
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

interface Evento {
  idevento: number;
  fecha_inicio: string;
  fecha_fin: string;
  ubicacion: string; // "descripcion" en la tabla eventos
  iddeporte: number;
  deporte?: string;
  color?: string;
}
interface Deporte {
  iddeporte: number;
  nombre: string;
  color: string;
}

interface DeportesListResponse {
  success: boolean;
  deportes?: {
    iddeporte: number | string;
    nombre: string;
    color: string;
  }[];
  error?: string;
}

interface Logro {
  id: number;
  titulo: string;
  descripcion: string;
  imagen: string;
  fecha: string;
  tipo: "competencia" | "evento" | "reconocimiento";
}

const NoticiasPublicas = () => {
  // --- Estados de Noticias ---
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  // --- Estados del Calendario ---
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  //--Deportes
  const [deportes, setDeportes] = useState<Deporte[]>([]);

  // --- Logros Estáticos ---
  const logros: Logro[] = [
    {
      id: 1,
      titulo: "Torneo Regional",
      descripcion: "Primer lugar en categoría infantil.",
      imagen: img1programas,
      fecha: "Marzo 2024",
      tipo: "competencia",
    },
    {
      id: 2,
      titulo: "Reconocimiento Estatal",
      descripcion: "Mejor academia deportiva del año.",
      imagen: img2programas,
      fecha: "Julio 2024",
      tipo: "reconocimiento",
    },
    {
      id: 3,
      titulo: "Copa Nacional",
      descripcion: "Participación destacada en gimnasia.",
      imagen: img3programas,
      fecha: "Septiembre 2024",
      tipo: "competencia",
    },
    {
      id: 4,
      titulo: "Festival de Verano",
      descripcion: "Exhibición anual con todas las categorías.",
      imagen: img1familia,
      fecha: "Noviembre 2024",
      tipo: "evento",
    },
  ];

  const collageImages = [
    img1nosostros,
    img1somos,
    img2nosostros,
    img2somos,
    img3somos,
    img1pilares,
  ];

  // --- FETCHING ---

  const fetchNoticias = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/noticias.php?action=listExtended&page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`
      );
      const data = await res.json();
      // Mapeo seguro para descripción
      const noticiasMapeadas = (data.noticias || []).map((n: any) => ({
        ...n,
        descripcion: n.descripcion || n.descricpion,
      }));
      setNoticias(noticiasMapeadas);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching noticias:", error);
    }
  };

  const fetchEventos = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/eventos.php?action=list`);
      const data = await res.json();
      if (data.success && data.eventos) {
        setEventos(data.eventos);
      }
    } catch (error) {
      console.error("Error fetching eventos:", error);
    }
  };

  useEffect(() => {
    fetchNoticias();
  }, [page, search]);

  useEffect(() => {
    fetchEventos();
    fetchDeportes();
  }, []);

  const totalPages = Math.ceil(total / limit);

  // --- CONFIGURACIÓN CALENDARIO (Similar a EventDashboard) ---

  const eventosById = useMemo(() => {
    const map = new Map<string, Evento>();
    eventos.forEach((e) => map.set(String(e.idevento), e));
    return map;
  }, [eventos]);

  // Transformar eventos para FullCalendar
  const calendarEvents = useMemo(() => {
    return eventos.map((e) => ({
      id: String(e.idevento),
      title: `${e.deporte ?? "Evento"} • ${e.ubicacion}`,
      start: e.fecha_inicio,
      end: e.fecha_fin,
      backgroundColor: e.color || "#3b82f6",
      borderColor: e.color || "#3b82f6",
      textColor: "#ffffff",
      classNames: [
        "rounded-md",
        "px-2",
        "py-1",
        "text-xs",
        "font-semibold",
        "shadow-sm",
        "cursor-pointer",
        "hover:opacity-90",
        "transition-opacity",
      ],
    }));
  }, [eventos]);

  // Handler al hacer click en un evento
  const handleEventClick = (info: EventClickArg) => {
    const ev = eventosById.get(info.event.id);
    if (!ev) return;
    setSelectedEvent(ev);
    setOpenDetails(true);
  };

  // Poner títulos en mayúsculas (estilo visual)
  const handleViewDidMount = useCallback(
    (arg: { view: ViewApi; el: HTMLElement }) => {
      const titleEl = arg.el.querySelector(".fc-toolbar-title");
      if (titleEl && titleEl.textContent) {
        titleEl.textContent = titleEl.textContent.toUpperCase();
      }
    },
    []
  );

  // --- RENDER HELPERS ---
  const getLogroIcon = (tipo: string) => {
    switch (tipo) {
      case "competencia":
        return <Trophy className="h-6 w-6" />;
      case "reconocimiento":
        return <Award className="h-6 w-6" />;
      case "evento":
        return <Star className="h-6 w-6" />;
      default:
        return <Medal className="h-6 w-6" />;
    }
  };

  const fetchDeportes = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/api/deportes.php?action=list`);
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data: DeportesListResponse = await res.json();
      if (data.success && data.deportes) {
        const list: Deporte[] = data.deportes.map((d) => ({
          iddeporte: Number(d.iddeporte),
          nombre: d.nombre,
          color: d.color || "#6b7280",
        }));
        setDeportes(list);
      }
    } catch (error: unknown) {
      console.error("Error al obtener deportes", error);
    }
  };

  const getLogroColor = (tipo: string) => {
    switch (tipo) {
      case "competencia":
        return "from-green-500 to-emerald-600";
      case "reconocimiento":
        return "from-blue-500 to-indigo-600";
      case "evento":
        return "from-teal-500 to-green-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* --- HERO SECTION --- */}
      <section className="relative h-[80vh] overflow-hidden bg-black">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1">
          {collageImages.map((img, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: idx * 0.1 }}
              className="relative overflow-hidden group"
            >
              <img
                src={img}
                alt={`Collage ${idx}`}
                className="h-full w-full object-cover opacity-80"
              />
            </motion.div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-center px-4 z-10"
          >
            <h1 className="text-6xl md:text-8xl font-extrabold text-white mb-6 tracking-tight">
              Noticias
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500">
                & Eventos
              </span>
            </h1>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 80C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* --- CALENDARIO DE EVENTOS --- */}
        <section className="py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Calendario de Eventos
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Haz clic en los eventos para ver más detalles.
            </p>
          </motion.div>

          {/* Contenedor del Calendario */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-2xl border-2 border-gray-200 shadow-xl bg-white p-6 overflow-hidden text-black"
          >
            {/* INYECCIÓN DEL CALENDARIO DIRECTA */}
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale={esLocale}
              height="auto"
              selectable={false} // Deshabilitar selección de fechas
              dayMaxEventRows={3}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "",
              }}
              buttonText={{
                today: "HOY",
              }}
              titleFormat={{ month: "long", year: "numeric" }}
              firstDay={1}
              eventClick={handleEventClick} // Solo click en evento
              viewDidMount={handleViewDidMount}
              events={calendarEvents}
            />
            {/* Leyenda */}
            {deportes.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-accent shadow-sm p-4 mt-3">
                <h3 className="text-sm font-medium mb-2">Leyenda</h3>
                <div className="flex flex-wrap gap-4 text-s">
                  {deportes.map((d) => (
                    <span key={d.iddeporte} className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-sm border border-black/10"
                        style={{ backgroundColor: d.color }}
                      />
                      {d.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </section>

        {/* --- DIALOG DE DETALLES DEL EVENTO (Solo Lectura) --- */}
        <Dialog open={openDetails} onOpenChange={setOpenDetails}>
          <DialogContent className="sm:max-w-[500px] rounded-xl border-0 shadow-2xl bg-gray-50">
            <DialogHeader className="border-b">
              <div className="flex items-center gap-3">
                <div
                  className="p-3 rounded-full shadow-md"
                  style={{ backgroundColor: selectedEvent?.color || "#3b82f6" }}
                >
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-800">
                    {selectedEvent?.deporte || "Evento Deportivo"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-500 mt-1 flex items-center gap-2">
                    {selectedEvent?.ubicacion}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {selectedEvent && (
              <div className="space-y-2 py-2">
                {/* Fechas */}
                <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-1" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-700">
                      Horario / Fechas
                    </p>
                    <p className="text-sm text-gray-600">
                      Inicia:{" "}
                      <span className="font-medium text-gray-900">
                        {selectedEvent.fecha_inicio}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Termina:{" "}
                      <span className="font-medium text-gray-900">
                        {selectedEvent.fecha_fin}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Detalles adicionales si existen */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Descripción del evento
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {selectedEvent.ubicacion} es una actividad organizada por el
                    gimnasio para la disciplina de {selectedEvent.deporte}. ¡Te
                    esperamos para apoyar a nuestros atletas!
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={() => setOpenDetails(false)}
                className="w-full sm:w-auto bg-blue-800 hover:bg-blue-700 text-white"
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* --- SECCIÓN DE LOGROS (Igual que antes) --- */}
        <section className="py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Nuestros Logros
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {logros.map((logro, idx) => (
              <motion.div
                key={logro.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="overflow-hidden border-2 hover:shadow-2xl transition-all duration-300 group">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={logro.imagen}
                      alt={logro.titulo}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 right-4">
                      <div
                        className={`p-3 rounded-full bg-gradient-to-r ${getLogroColor(
                          logro.tipo
                        )} text-white shadow-lg`}
                      >
                        {getLogroIcon(logro.tipo)}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {logro.titulo}
                    </h3>
                    <p className="text-gray-600">{logro.descripcion}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Sección de Noticias */}
        <section className="py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Últimas Noticias
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Mantente informado sobre competencias, eventos y actividades
              deportivas
            </p>
          </motion.div>

          {/* Barra de búsqueda */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-12"
          >
            <div className="relative w-full max-w-2xl">
              <Input
                placeholder="Buscar por título, descripción o deporte..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-12 pr-4 py-6 rounded-xl shadow-lg border-2 border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-lg"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
            </div>
          </motion.div>

          {/* Grid de noticias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {noticias.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                  <Search className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-xl text-gray-500">
                  No se encontraron noticias
                </p>
                <p className="text-gray-400 mt-2">
                  Intenta con otros términos de búsqueda
                </p>
              </div>
            ) : (
              noticias.map((n, idx) => (
                <motion.div
                  key={n.idnoticias}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Card className="h-full shadow-lg hover:shadow-2xl hover:shadow-blue-100/50 hover:border-blue-300 border-2 border-gray-200 rounded-xl overflow-hidden bg-white transition-all duration-300 hover:-translate-y-2 group">
                    <CardHeader className="p-0 relative overflow-hidden">
                      <img
                        src={API_BASE + "/" + n.imagen}
                        alt={n.titulo}
                        className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </CardHeader>

                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {n.titulo}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                        {n.descricpion}
                      </p>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <div className="p-1.5 rounded-full bg-blue-100">
                            <Dumbbell className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <span className="font-medium">{n.deporte}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <div className="p-1.5 rounded-full bg-green-100">
                            <MapPin className="h-3.5 w-3.5 text-green-600" />
                          </div>
                          <span>{n.ubicacion}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <div className="p-1.5 rounded-full bg-purple-100">
                            <Calendar className="h-3.5 w-3.5 text-purple-600" />
                          </div>
                          <span className="text-xs">
                            {new Date(n.fecha_inicio).toLocaleDateString()} -{" "}
                            {new Date(n.fecha_fin).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        Publicado:{" "}
                        {new Date(n.fecha_publicacion).toLocaleDateString()}
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Paginación mejorada */}
          {total > limit && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex justify-center items-center gap-4"
            >
              <Button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-6"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Anterior
              </Button>

              <div className="flex items-center gap-2">
                <span className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700">
                  {page}
                </span>
                <span className="text-gray-500">de</span>
                <span className="px-4 py-2 bg-gray-100 rounded-xl font-semibold text-gray-700">
                  {totalPages}
                </span>
              </div>

              <Button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-6"
              >
                Siguiente
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
};

export default NoticiasPublicas;
