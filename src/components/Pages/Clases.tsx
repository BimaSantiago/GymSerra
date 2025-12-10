"use client";
import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Calculator, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

/* ------------------------- Tipos de datos ------------------------- */
interface PlanPago {
  idplan: number;
  idnivel: number;
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
}

/* ------------------------- Componente principal ------------------------- */
const Clases: React.FC = () => {
  const [planes, setPlanes] = useState<PlanPago[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(true);

  // Estado calculadora
  const [selectedNivel, setSelectedNivel] = useState<number | null>(1);
  const [selectedDias, setSelectedDias] = useState<number | null>(2);
  const [numAlumnos, setNumAlumnos] = useState<number>(1);
  const [usarPromocion, setUsarPromocion] = useState<boolean>(true);

  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const horas = [
    1430, 1500, 1530, 1600, 1630, 1700, 1730, 1800, 1830, 1900, 1930, 2000,
  ];

  const niveles = [
    { id: 1, nombre: "Gimnasia Inicial (Prenivel)" },
    { id: 2, nombre: "Gimnasia General (Nivel 1 al 4)" },
    { id: 3, nombre: "Parkour" },
  ];

  /* ------------------------- Fetch data ------------------------- */
  useEffect(() => {
    fetchPlanes();
    fetchHorarios();
  }, []);

  const fetchPlanes = async () => {
    setLoadingPlanes(true);
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/plan_pago.php?action=list"
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.planes)) {
        const normalizados: PlanPago[] = data.planes.map((p: any) => ({
          idplan: Number(p.idplan),
          idnivel: Number(p.idnivel),
          dias_por_semana: Number(p.dias_por_semana),
          costo: Number(p.costo),
          costo_promocion: Number(p.costo_promocion),
          costo_penalizacion: Number(p.costo_penalizacion),
        }));
        setPlanes(normalizados);
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
        "http://localhost/GymSerra/public/api/horarios.php?action=list"
      );
      const data = await res.json();
      if (Array.isArray(data.horarios)) {
        const normalizados: Horario[] = data.horarios.map((h: any) => ({
          ...h,
          idhorario: Number(h.idhorario),
          hora_inicio: Number(h.hora_inicio),
          hora_fin: Number(h.hora_fin),
          dia: Number(h.dia),
        }));
        setHorarios(normalizados);
      }
    } catch {
      setAlert({ type: "error", message: "Error al cargar horarios" });
    } finally {
      setLoadingHorarios(false);
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

  const colorDeporte = (nombre?: string) => {
    switch (nombre) {
      case "Gimnasia Artística":
        return "bg-primary/10 border-primary/40";
      case "Parkour":
        return "bg-emerald-500/15 border-emerald-500/40";
      case "Crossfit":
        return "bg-amber-500/15 border-amber-500/40";
      default:
        return "bg-muted/40 border-border";
    }
  };

  const planesDelNivel = useMemo(
    () =>
      selectedNivel ? planes.filter((p) => p.idnivel === selectedNivel) : [],
    [planes, selectedNivel]
  );

  const planSeleccionado = useMemo(
    () =>
      selectedNivel && selectedDias
        ? planes.find(
            (p) =>
              p.idnivel === selectedNivel && p.dias_por_semana === selectedDias
          ) || null
        : null,
    [planes, selectedNivel, selectedDias]
  );

  const costoBase = planSeleccionado
    ? usarPromocion && planSeleccionado.costo_promocion > 0
      ? planSeleccionado.costo_promocion
      : planSeleccionado.costo
    : 0;

  const totalMensual = Math.max(0, costoBase * Math.max(1, numAlumnos));
  const costoPorClaseAprox =
    planSeleccionado && planSeleccionado.dias_por_semana > 0
      ? Math.round(
          (totalMensual / (planSeleccionado.dias_por_semana * 4)) * 10
        ) / 10
      : 0;

  /* ------------------------- UI ------------------------- */
  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-16 bg-background text-foreground">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center text-3xl font-bold tracking-tight"
      >
        Clases y Planes
      </motion.h1>

      {alert && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="rounded-lg border-border bg-card text-foreground"
        >
          {alert.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
          <AlertTitle className="text-sm font-medium">
            {alert.type === "success" ? "Éxito" : "Error"}
          </AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* ------------------------- HORARIOS ------------------------- */}
      <section className="space-y-6">
        <h2 className="text-center text-2xl font-semibold">
          Horarios semanales
        </h2>
        <p className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
          Consulta los horarios por día y disciplina. Los colores te ayudan a
          ubicar rápidamente cada deporte.
        </p>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          {loadingHorarios ? (
            <div className="space-y-2 p-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-9 w-full bg-muted/60" />
              ))}
            </div>
          ) : (
            <table className="min-w-full text-center text-xs sm:text-sm">
              <thead className="bg-muted/70 text-muted-foreground">
                <tr>
                  <th className="border border-border px-2 py-2 font-semibold">
                    Hora
                  </th>
                  {dias.map((d, idx) => (
                    <th
                      key={idx}
                      className="border border-border px-2 py-2 font-semibold"
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horas.map((h) => (
                  <tr key={h}>
                    <td className="border border-border px-2 py-2 font-medium text-muted-foreground">
                      {formatearHora(h)}
                    </td>
                    {dias.map((_, diaIdx) => {
                      const horario = horarios.find(
                        (x) =>
                          Number(x.hora_inicio) === h &&
                          Number(x.dia) === diaIdx + 1
                      );
                      const nombreDep = horario?.deporte;
                      return (
                        <td
                          key={`${diaIdx}-${h}`}
                          className={`border border-border px-2 py-2 align-top transition-all duration-200 ${colorDeporte(
                            nombreDep
                          )}`}
                        >
                          {horario ? (
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold">
                                {horario.deporte}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {horario.nivel}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
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
        </div>
      </section>

      {/* ------------------------- PLANES & CALCULADORA ------------------------- */}
      <section className="space-y-10">
        <h2 className="text-center text-2xl font-semibold">
          Planes de pago y calculadora
        </h2>

        <Tabs defaultValue="calculadora" className="w-full">
          <TabsList className="mx-auto mb-6 flex max-w-md justify-center">
            <TabsTrigger value="calculadora">Calculadora</TabsTrigger>
            <TabsTrigger value="tabla">Ver todos los planes</TabsTrigger>
          </TabsList>

          {/* CALCULADORA */}
          <TabsContent value="calculadora" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
              <Card className="border-border bg-card/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                    <Calculator className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      Calcula tu mensualidad aproximada
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Selecciona nivel, días por semana y número de alumnos.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Nivel */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Nivel / disciplina
                      </label>
                      <Select
                        value={selectedNivel?.toString() ?? ""}
                        onValueChange={(val) =>
                          setSelectedNivel(Number(val) || null)
                        }
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Elige un nivel" />
                        </SelectTrigger>
                        <SelectContent>
                          {niveles.map((n) => (
                            <SelectItem key={n.id} value={n.id.toString()}>
                              {n.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Días por semana */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Días por semana
                      </label>
                      <Select
                        value={selectedDias?.toString() ?? ""}
                        onValueChange={(val) =>
                          setSelectedDias(Number(val) || null)
                        }
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Elige días" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((d) => (
                            <SelectItem key={d} value={d.toString()}>
                              {d} día{d > 1 && "s"} por semana
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Num alumnos + promoción */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Número de alumnos
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={numAlumnos}
                        onChange={(e) =>
                          setNumAlumnos(
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                        className="bg-background"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Ideal para calcular hermanos o amigos que se inscriben
                        juntos.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                        <span>Aplicar costo en promoción</span>
                        <Switch
                          checked={usarPromocion}
                          onCheckedChange={setUsarPromocion}
                        />
                      </label>
                      <p className="text-[11px] text-muted-foreground">
                        Si el plan tiene costo de promoción, lo usamos como base
                        para el cálculo.
                      </p>
                    </div>
                  </div>

                  {/* Resumen del plan encontrado */}
                  <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
                    {planSeleccionado ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2 justify-between">
                          <span className="font-medium">
                            Plan encontrado para{" "}
                            <span className="underline">
                              {planesDelNivel.length > 0
                                ? niveles.find((n) => n.id === selectedNivel)
                                    ?.nombre
                                : "este nivel"}
                            </span>
                          </span>
                          <Badge
                            variant="outline"
                            className="border-primary/40"
                          >
                            {planSeleccionado.dias_por_semana} día
                            {planSeleccionado.dias_por_semana > 1 && "s"} por
                            semana
                          </Badge>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Costo base seleccionado
                            </p>
                            <p className="text-sm font-semibold">
                              ${costoBase.toLocaleString("es-MX")}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Total mensual (x{numAlumnos})
                            </p>
                            <p className="text-sm font-semibold text-primary">
                              ${totalMensual.toLocaleString("es-MX")}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              Aproximado por clase
                            </p>
                            <p className="text-sm font-semibold">
                              $
                              {costoPorClaseAprox.toLocaleString("es-MX", {
                                maximumFractionDigits: 1,
                              })}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-start gap-2 text-xs">
                        <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Ajusta el nivel y los días por semana para encontrar
                          un plan válido. Si no aparece nada, aún no hay un plan
                          configurado con esa combinación.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-border/80 px-6 py-4 text-xs text-muted-foreground">
                  <span>
                    Los montos mostrados son aproximados y pueden variar por
                    promociones vigentes.
                  </span>
                </CardFooter>
              </Card>

              <Card className="border-border bg-card/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-base">
                    ¿Cómo elegir el mejor plan?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    • Para{" "}
                    <span className="font-semibold">
                      niñas y niños que inician
                    </span>
                    , 2 días por semana suelen ser ideales.
                  </p>
                  <p>
                    • Si buscan{" "}
                    <span className="font-semibold">competencias</span> o
                    avanzar más rápido, considera 3 a 4 días por semana.
                  </p>
                  <p>
                    • Para <span className="font-semibold">parkour</span>, los
                    días adicionales ayudan a mejorar fuerza y coordinación.
                  </p>
                  <p className="text-xs">
                    Si tienes dudas, puedes acercarte directamente en recepción
                    y ajustar tu plan.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TABLA COMPLETA */}
          <TabsContent value="tabla" className="space-y-6">
            {loadingPlanes ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Card
                    key={i}
                    className="border-border bg-card/80 p-4 space-y-3"
                  >
                    <Skeleton className="h-5 w-1/2 bg-muted/60" />
                    <Skeleton className="h-8 w-full bg-muted/60" />
                    <Skeleton className="h-8 w-full bg-muted/60" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {niveles.map((nivel) => {
                  const planesNivel = planes.filter(
                    (p) => p.idnivel === nivel.id
                  );
                  return (
                    <Card
                      key={nivel.id}
                      className="rounded-xl border border-border bg-card/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <CardHeader>
                        <CardTitle className="text-base font-semibold">
                          {nivel.nombre}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {planesNivel.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Días</TableHead>
                                <TableHead>Promoción</TableHead>
                                <TableHead>Normal</TableHead>
                                <TableHead>Penalización</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {planesNivel.map((p) => (
                                <TableRow key={p.idplan}>
                                  <TableCell>{p.dias_por_semana}</TableCell>
                                  <TableCell>
                                    ${p.costo_promocion.toLocaleString("es-MX")}
                                  </TableCell>
                                  <TableCell>
                                    ${p.costo.toLocaleString("es-MX")}
                                  </TableCell>
                                  <TableCell>
                                    $
                                    {p.costo_penalizacion.toLocaleString(
                                      "es-MX"
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No hay planes registrados para este nivel.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default Clases;
