"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

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
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/plan_pago.php?action=list"
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.planes)) setPlanes(data.planes);
      else
        setAlert({
          type: "error",
          message: "Error al cargar los planes de pago",
        });
    } catch {
      setAlert({ type: "error", message: "Error de conexión con el servidor" });
    }
  };

  const fetchHorarios = async () => {
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/horarios.php?action=list"
      );
      const data = await res.json();
      if (Array.isArray(data.horarios)) setHorarios(data.horarios);
    } catch {
      setAlert({ type: "error", message: "Error al cargar horarios" });
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
        return "bg-blue-50 border-blue-200";
      case "Parkour":
        return "bg-emerald-50 border-emerald-200";
      case "Crossfit":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-white border-gray-200";
    }
  };

  /* ------------------------- UI ------------------------- */
  return (
    <div className="p-6 space-y-16 max-w-7xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-3xl font-bold text-center text-gray-800"
      >
        Clases y Planes
      </motion.h1>

      {alert && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="rounded-lg shadow-sm bg-gray-50 border-gray-200"
        >
          {alert.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertTitle className="text-sm font-medium text-gray-800">
            {alert.type === "success" ? "Éxito" : "Error"}
          </AlertTitle>
          <AlertDescription className="text-sm text-gray-600">
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* ------------------------- HORARIOS ------------------------- */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Horarios Semanales
        </h2>
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full text-sm text-center">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="border p-2">Hora</th>
                {dias.map((d, idx) => (
                  <th key={idx} className="border p-2">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {horas.map((h) => (
                <tr key={h}>
                  <td className="border p-2 font-medium text-gray-600">
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
                        className={`border p-2 transition-all duration-200 ${colorDeporte(
                          nombreDep
                        )}`}
                      >
                        {horario ? (
                          <div className="space-y-0.5">
                            <p className="font-semibold text-gray-900">
                              {horario.deporte}
                            </p>
                            <p className="text-xs text-gray-600">
                              {horario.nivel}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ------------------------- PLANES DE PAGO ------------------------- */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Planes de Pago
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {niveles.map((nivel) => {
            const planesNivel = planes.filter(
              (p) => Number(p.idnivel) === nivel.id
            );
            return (
              <Card
                key={nivel.id}
                className="rounded-xl border shadow-sm hover:shadow-md transition-shadow bg-white"
              >
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-800">
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
                          <TableHead>Costo</TableHead>
                          <TableHead>Penalización</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {planesNivel.map((p) => (
                          <TableRow key={p.idplan}>
                            <TableCell>{p.dias_por_semana}</TableCell>
                            <TableCell>${p.costo_promocion}</TableCell>
                            <TableCell>${p.costo}</TableCell>
                            <TableCell>${p.costo_penalizacion}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No hay planes registrados.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Clases;
