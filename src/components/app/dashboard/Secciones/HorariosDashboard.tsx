import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";

interface Horario {
  idhorario: number;
  hora_inicio: number;
  hora_fin: number;
  dia: number;
  deporte: string; // nombre que llega de la API
  nivel: string; // nombre que llega de la API
}

const HorariosDashboard = () => {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [form, setForm] = useState({
    idhorario: 0,
    hora_inicio: 0,
    hora_fin: 0,
    dia: 1,
    iddeporte: "",
    idnivel: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const deportes = [
    { id: "1", nombre: "Gimnasia Artística" },
    { id: "2", nombre: "Parkour" },
    { id: "3", nombre: "Crossfit" },
  ];
  const niveles = [
    { id: "1", nombre: "Prenivel" },
    { id: "2", nombre: "Nivel 1" },
    { id: "3", nombre: "Nivel 2" },
    { id: "4", nombre: "Nivel 3" },
    { id: "5", nombre: "Nivel 4" },
    { id: "6", nombre: "Principiante" },
    { id: "7", nombre: "Avanzado" },
  ];

  // Mapas nombre <-> id para precargar correctamente en edición
  const deporteNameToId = Object.fromEntries(
    deportes.map((d) => [d.nombre, d.id])
  );
  const nivelNameToId = Object.fromEntries(
    niveles.map((n) => [n.nombre, n.id])
  );
  const idToDeporteName = Object.fromEntries(
    deportes.map((d) => [d.id, d.nombre])
  );
  const idToNivelName = Object.fromEntries(
    niveles.map((n) => [n.id, n.nombre])
  );

  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const horas = [
    1430, 1500, 1530, 1600, 1630, 1700, 1730, 1800, 1830, 1900, 1930, 2000,
  ];

  const fetchHorarios = async () => {
    try {
      const response = await fetch(
        "http://localhost/GymSerra/public/api/horarios.php?action=list"
      );
      if (!response.ok) throw new Error("Error en la respuesta de la API");
      const data = await response.json();
      setHorarios(data.horarios || []);
    } catch (error) {
      console.error("Error al obtener horarios:", error);
      setAlert({ type: "error", message: "Error al cargar los horarios" });
      setTimeout(() => setAlert(null), 2500);
    }
  };

  useEffect(() => {
    fetchHorarios();
  }, []);

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
        return "bg-blue-50 hover:bg-blue-100 border-blue-200";
      case "Parkour":
        return "bg-emerald-50 hover:bg-emerald-100 border-emerald-200";
      case "Crossfit":
        return "bg-amber-50 hover:bg-amber-100 border-amber-200";
      default:
        return "bg-white hover:bg-gray-50 border-gray-200";
    }
  };

  const handleCellClick = (hora: number, dia: number) => {
    const horario = horarios.find(
      (h) => Number(h.hora_inicio) === hora && Number(h.dia) === dia
    );

    if (horario) {
      // ⛏️ mapeo de nombre → id para precargar Selects correctamente
      setForm({
        idhorario: horario.idhorario,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
        dia: horario.dia,
        iddeporte: deporteNameToId[horario.deporte] ?? "",
        idnivel: nivelNameToId[horario.nivel] ?? "",
      });
    } else {
      setForm({
        idhorario: 0,
        hora_inicio: hora,
        hora_fin: hora + 30,
        dia,
        iddeporte: "",
        idnivel: "",
      });
    }

    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.iddeporte || !form.idnivel) {
      setAlert({
        type: "error",
        message: "Debe seleccionar un deporte y nivel",
      });
      setTimeout(() => setAlert(null), 2500);
      return;
    }

    const payload = {
      ...form,
      deporte: idToDeporteName[form.iddeporte] ?? undefined,
      nivel: idToNivelName[form.idnivel] ?? undefined,
    };

    const action = form.idhorario ? "update" : "create";
    try {
      const response = await fetch(
        `http://localhost/GymSerra/public/api/horarios.php?action=${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (data.success) {
        setAlert({
          type: "success",
          message: form.idhorario ? "Horario actualizado" : "Horario creado",
        });
        fetchHorarios();
        setIsDialogOpen(false);
      } else {
        setAlert({
          type: "error",
          message: data.error || "No se pudo guardar",
        });
      }
      setTimeout(() => setAlert(null), 2500);
    } catch (error) {
      console.error("Error al procesar el horario:", error);
      setAlert({ type: "error", message: "Error al procesar el horario" });
      setTimeout(() => setAlert(null), 2500);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Horario Semanal</h2>

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

      {/* Tabla principal */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm text-center">
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
              <tr key={h} className="border-t">
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
                      onClick={() => handleCellClick(h, diaIdx + 1)}
                      className={`border p-2 cursor-pointer transition-all duration-200 rounded-md ${colorDeporte(
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
                        <span className="text-gray-400 text-sm">Agregar</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-gray-900">
              {form.idhorario ? "Editar Horario" : "Nuevo Horario"} (
              {formatearHora(form.hora_inicio)} - {formatearHora(form.hora_fin)}
              )
            </DialogTitle>
            <DialogDescription>
              Selecciona el deporte y el nivel para el horario del día{" "}
              {dias[form.dia - 1]} a las {formatearHora(form.hora_inicio)}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">
                Deporte
              </Label>
              <Select
                value={form.iddeporte}
                onValueChange={(v) => setForm({ ...form, iddeporte: v })}
              >
                <SelectTrigger className="mt-1 rounded-lg border-gray-200">
                  <SelectValue placeholder="Selecciona un deporte" />
                </SelectTrigger>
                <SelectContent>
                  {deportes.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Nivel</Label>
              <Select
                value={form.idnivel}
                onValueChange={(v) => setForm({ ...form, idnivel: v })}
              >
                <SelectTrigger className="mt-1 rounded-lg border-gray-200">
                  <SelectValue placeholder="Selecciona un nivel" />
                </SelectTrigger>
                <SelectContent>
                  {niveles.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full bg-gray-800 text-white hover:bg-gray-700 rounded-lg shadow-sm"
            >
              {form.idhorario ? "Actualizar" : "Guardar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HorariosDashboard;
