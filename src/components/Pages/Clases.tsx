import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import GridMotion from "@/components/GridMotion";
import {
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Award,
  Users,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
/* ------------------------- Tipos de datos ------------------------- */
interface PlanPago {
  idplan: number;
  iddeporte: number;
  deporte: string;
  dias_por_semana: number;
  costo: number;
  costo_promocion: number;
  costo_penalizacion: number;
}

interface Horario {
  idhorario: number;
  hora_inicio: number;
  hora_fin: number;
  dia: number;
  deporte: string;
  nivel: string;
  color: string;
}

interface Deporte {
  iddeporte: number;
  nombre: string;
  descripcion: string;
  color: string;
}

interface Instructor {
  idinstructor: number;
  iddeporte: number;
  nombre: string;
  appaterno: string;
  apmaterno: string;
  telefono: string;
  correo: string;
}

// note: you'll need to make sure the parent container of this component is sized properly
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
import img2pilares from "../../assets/img2pilares.svg";
import img3pilares from "../../assets/img3pilares.svg";
import img4pilares from "../../assets/img4pilares.svg";
import imgmision from "../../assets/imgmision (2).svg";
import imgvision from "../../assets/imgvision.svg";

// note: you'll need to make sure the parent container of this component is sized properly
const items = [
  img1familia,
  img1nosostros,
  img1programas,
  img1somos,
  img2nosostros,
  img2programas,
  img2somos,
  img3programas,
  img3somos,
  img1pilares,
  img2pilares,
  img3pilares,
  img4pilares,
  imgmision,
  imgvision,
  // Add more items as needed
];

/* ------------------------- Componente principal ------------------------- */
const Clases: React.FC = () => {
  const [planes, setPlanes] = useState<PlanPago[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(true);
  const [loadingDeportes, setLoadingDeportes] = useState(true);
  const [loadingInstructores, setLoadingInstructores] = useState(true);

  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const horas = [
    1430, 1500, 1530, 1600, 1630, 1700, 1730, 1800, 1830, 1900, 1930, 2000,
  ];

  /* ------------------------- Fetch data ------------------------- */
  useEffect(() => {
    fetchDeportes();
    fetchPlanes();
    fetchHorarios();
    fetchInstructores();
  }, []);

  const fetchDeportes = async () => {
    setLoadingDeportes(true);
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/clases.php?action=deportes"
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.deportes)) {
        setDeportes(data.deportes);
      } else {
        setAlert({
          type: "error",
          message: "Error al cargar los deportes",
        });
      }
    } catch {
      setAlert({ type: "error", message: "Error de conexión con el servidor" });
    } finally {
      setLoadingDeportes(false);
    }
  };

  const fetchPlanes = async () => {
    setLoadingPlanes(true);
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/clases.php?action=planes"
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.planes)) {
        setPlanes(data.planes);
      } else {
        setAlert({
          type: "error",
          message: "Error al cargar los planes de pago",
        });
      }
    } catch {
      setAlert({ type: "error", message: "Error de conexión con el servidor" });
    } finally {
      setLoadingPlanes(false);
    }
  };

  const fetchHorarios = async () => {
    setLoadingHorarios(true);
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/clases.php?action=horarios"
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.horarios)) {
        setHorarios(data.horarios);
      } else {
        setAlert({ type: "error", message: "Error al cargar horarios" });
      }
    } catch {
      setAlert({ type: "error", message: "Error al cargar horarios" });
    } finally {
      setLoadingHorarios(false);
    }
  };

  const fetchInstructores = async () => {
    setLoadingInstructores(true);
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/clases.php?action=instructores"
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.instructores)) {
        setInstructores(data.instructores);
      } else {
        setAlert({ type: "error", message: "Error al cargar instructores" });
      }
    } catch {
      setAlert({ type: "error", message: "Error al cargar instructores" });
    } finally {
      setLoadingInstructores(false);
    }
  };

  /* ------------------------- Utilidades ------------------------- */
  const formatearHora = (h: number) => {
    const hh = Math.floor(h / 100);
    const mm = h % 100;
    return `${hh.toString().padStart(2, "0")}:${mm
      .toString()
      .padStart(2, "0")}`;
  };

  const planesAgrupados = useMemo(() => {
    const grupos: { [key: number]: PlanPago[] } = {};
    planes.forEach((plan) => {
      if (!grupos[plan.iddeporte]) {
        grupos[plan.iddeporte] = [];
      }
      grupos[plan.iddeporte].push(plan);
    });
    return grupos;
  }, [planes]);

  const instructoresPorDeporte = useMemo(() => {
    const grupos: { [key: number]: Instructor[] } = {};
    instructores.forEach((instructor) => {
      if (!grupos[instructor.iddeporte]) {
        grupos[instructor.iddeporte] = [];
      }
      grupos[instructor.iddeporte].push(instructor);
    });
    return grupos;
  }, [instructores]);

  const LoadingSkeleton = ({ height = "h-32" }: { height?: string }) => (
    <div className={`${height} w-full animate-pulse rounded-lg bg-gray-200`} />
  );

  /* ------------------------- UI ------------------------- */
  return (
    <div className="relative min-h-screen bg-gray-900">
      {/* Sticky Background Animation */}
      <div className="sticky top-0 h-screen w-full overflow-hidden z-0">
        <GridMotion items={items} />
        {/* Overlay gradient for better text readability in Hero */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-gray-900/90 z-[1]" />
      </div>

      {/* Main Scrollable Content */}
      <div className="relative z-10 -mt-[100vh]">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="backdrop-blur-sm bg-black/30 rounded-3xl p-8 border border-white/10 shadow-2xl inline-block max-w-4xl"
          >
            <h1 className="mb-6 text-5xl md:text-7xl font-extrabold text-white tracking-tight drop-shadow-lg">
              Descubre Nuestras
              <span className="block bg-gradient-to-r from-green-300 to-green-500 bg-clip-text text-transparent">
                Disciplinas
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg md:text-xl text-blue-100 font-medium drop-shadow-md">
              Encuentra tu pasión en la gimnasia artística, parkour y más.
              Instructores profesionales y horarios flexibles para ti.
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5, type: "spring" }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <div className="rounded-full bg-white/10 backdrop-blur-md px-6 py-3 text-white border border-white/20 hover:bg-white/20 transition-colors">
              <Calendar className="inline-block mr-2 h-5 w-5" />
              <span className="font-semibold">Clases Semanales</span>
            </div>
            <div className="rounded-full bg-white/10 backdrop-blur-md px-6 py-3 text-white border border-white/20 hover:bg-white/20 transition-colors">
              <Users className="inline-block mr-2 h-5 w-5" />
              <span className="font-semibold">Todos los Niveles</span>
            </div>
          </motion.div>
        </section>

        {/* Content Container with Background */}
        <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-t-[3rem] pt-16 pb-16 px-4 md:px-8">
          <div className="mx-auto max-w-7xl">
            {alert && (
              <Alert
                variant={alert.type === "success" ? "default" : "destructive"}
                className="mb-8 rounded-lg"
              >
                {alert.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle className="text-sm font-medium">
                  {alert.type === "success" ? "Éxito" : "Error"}
                </AlertTitle>
                <AlertDescription className="text-sm">
                  {alert.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Deportes y Planes de Pago */}
            <section id="disciplinas">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Nuestras Disciplinas y Planes
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Elige la disciplina que más te apasione y selecciona el plan
                  que mejor se adapte a tus objetivos. Todos nuestros planes
                  incluyen acceso completo a instalaciones y supervisión
                  profesional.
                </p>
              </motion.div>

              {loadingDeportes || loadingPlanes ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-6">
                      <LoadingSkeleton height="h-8" />
                      <div className="mt-4">
                        <LoadingSkeleton height="h-20" />
                      </div>
                      <div className="mt-4">
                        <LoadingSkeleton height="h-32" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {deportes
                    .filter((d) => d.iddeporte !== 5)
                    .map((deporte, index) => (
                      <motion.div
                        key={deporte.iddeporte}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <Card className="h-full overflow-hidden border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white">
                          <div
                            className="h-2"
                            style={{ backgroundColor: deporte.color }}
                          />
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-2xl font-bold mb-2">
                                  {deporte.nombre}
                                </CardTitle>
                                <p className="text-sm text-gray-600">
                                  {deporte.descripcion}
                                </p>
                              </div>
                              <Award className="h-8 w-8 text-gray-400" />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                <TrendingUp className="h-4 w-4" />
                                <span>Planes disponibles</span>
                              </div>

                              {planesAgrupados[deporte.iddeporte]?.length >
                              0 ? (
                                <div className="space-y-3">
                                  {planesAgrupados[deporte.iddeporte].map(
                                    (plan) => (
                                      <div
                                        key={plan.idplan}
                                        className="rounded-lg border-2 border-gray-200 p-4 hover:border-blue-400 transition-colors bg-gradient-to-br from-white to-gray-50"
                                      >
                                        <div className="flex items-center justify-between mb-3">
                                          <Badge
                                            variant="outline"
                                            className="text-sm font-semibold"
                                          >
                                            {plan.dias_por_semana}{" "}
                                            {plan.dias_por_semana === 1
                                              ? "día"
                                              : "días"}{" "}
                                            / semana
                                          </Badge>
                                          <Zap className="h-4 w-4 text-yellow-500" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                          <div>
                                            <p className="text-gray-500 text-xs mb-1">
                                              Precio Promoción
                                            </p>
                                            <p className="text-lg font-bold text-green-600">
                                              $
                                              {plan.costo_promocion.toLocaleString(
                                                "es-MX"
                                              )}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-gray-500 text-xs mb-1">
                                              Precio Regular
                                            </p>
                                            <p className="text-lg font-bold text-gray-700">
                                              $
                                              {plan.costo.toLocaleString(
                                                "es-MX"
                                              )}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                          <p className="text-xs text-gray-500">
                                            <span className="font-semibold">
                                              Costo por clase aprox:
                                            </span>{" "}
                                            $
                                            {Math.round(
                                              plan.costo_promocion /
                                                (plan.dias_por_semana * 4)
                                            )}
                                          </p>
                                          <p className="text-xs text-red-600 mt-1">
                                            Penalización por pago tardío: $
                                            {plan.costo_penalizacion.toLocaleString(
                                              "es-MX"
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 italic">
                                  No hay planes disponibles para esta disciplina
                                  actualmente.
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </div>
              )}
            </section>

            {/* Horarios */}
            <section className="mt-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Horarios Semanales
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Consulta nuestros horarios organizados por día y disciplina.
                  Encuentra el horario perfecto que se adapte a tu rutina.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="overflow-x-auto rounded-2xl border-2 border-gray-200 shadow-xl bg-white"
              >
                {loadingHorarios ? (
                  <div className="p-8 space-y-4">
                    {[...Array(8)].map((_, i) => (
                      <LoadingSkeleton key={i} height="h-12" />
                    ))}
                  </div>
                ) : (
                  <table className="min-w-full text-center text-sm">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="border border-gray-300 px-4 py-4 font-bold text-gray-700">
                          <Clock className="inline-block mr-2 h-5 w-5" />
                          Hora
                        </th>
                        {dias.map((d, idx) => (
                          <th
                            key={idx}
                            className="border border-gray-300 px-4 py-4 font-bold text-gray-700"
                          >
                            {d}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {horas.map((h, hIdx) => (
                        <tr
                          key={h}
                          className={hIdx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                        >
                          <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-600">
                            {formatearHora(h)}
                          </td>
                          {dias.map((_, diaIdx) => {
                            const horario = horarios.find(
                              (x) =>
                                Number(x.hora_inicio) === h &&
                                Number(x.dia) === diaIdx + 1
                            );
                            return (
                              <td
                                key={`${diaIdx}-${h}`}
                                className={`border border-gray-300 px-3 py-3 align-top transition-all duration-200 ${
                                  horario
                                    ? "hover:scale-105 cursor-pointer"
                                    : ""
                                }`}
                                style={{
                                  backgroundColor: horario
                                    ? `${horario.color}20`
                                    : "transparent",
                                  borderLeft: horario
                                    ? `4px solid ${horario.color}`
                                    : undefined,
                                }}
                              >
                                {horario ? (
                                  <div className="space-y-1">
                                    <p className="text-sm font-bold text-gray-800">
                                      {horario.deporte}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {horario.nivel}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    —
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </motion.div>
            </section>

            {/* Instructores */}
            <section className="mt-24 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Nuestros Instructores
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Conoce al equipo de profesionales certificados que te guiarán
                  en tu camino hacia el éxito deportivo.
                </p>
              </motion.div>

              {loadingInstructores ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-6">
                      <LoadingSkeleton height="h-8" />
                      <div className="mt-4">
                        <LoadingSkeleton height="h-20" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-12">
                  {deportes
                    .filter(
                      (d) =>
                        d.iddeporte !== 5 &&
                        instructoresPorDeporte[d.iddeporte]?.length > 0
                    )
                    .map((deporte) => (
                      <motion.div
                        key={deporte.iddeporte}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                      >
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                          <div
                            className="w-1 h-8 rounded"
                            style={{ backgroundColor: deporte.color }}
                          />
                          {deporte.nombre}
                        </h3>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {instructoresPorDeporte[deporte.iddeporte]?.map(
                            (instructor, idx) => (
                              <motion.div
                                key={instructor.idinstructor}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                              >
                                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-400">
                                  <div
                                    className="h-2"
                                    style={{ backgroundColor: deporte.color }}
                                  />
                                  <CardContent className="pt-6">
                                    <div className="flex items-start gap-4">
                                      <div
                                        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
                                        style={{
                                          backgroundColor: deporte.color,
                                        }}
                                      >
                                        {instructor.nombre.charAt(0)}
                                        {instructor.appaterno.charAt(0)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-lg text-gray-900 mb-1">
                                          {instructor.nombre}{" "}
                                          {instructor.appaterno}{" "}
                                          {instructor.apmaterno}
                                        </h4>
                                        <p className="text-sm text-gray-600 mb-3">
                                          Instructor de {deporte.nombre}
                                        </p>
                                        <div className="space-y-2 text-sm">
                                          <p className="text-gray-700 flex items-center gap-2">
                                            <span className="text-gray-500">
                                              📞
                                            </span>
                                            <a
                                              href={`tel:${instructor.telefono}`}
                                              className="hover:text-blue-600 transition-colors"
                                            >
                                              {instructor.telefono}
                                            </a>
                                          </p>
                                          <p className="text-gray-700 flex items-center gap-2 break-all">
                                            <span className="text-gray-500">
                                              ✉️
                                            </span>
                                            <a
                                              href={`mailto:${instructor.correo}`}
                                              className="hover:text-blue-600 transition-colors"
                                            >
                                              {instructor.correo}
                                            </a>
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            )
                          )}
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}

              {!loadingInstructores && instructores.length === 0 && (
                <Card className="p-12 text-center">
                  <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    Actualmente no hay instructores registrados.
                  </p>
                </Card>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clases;
