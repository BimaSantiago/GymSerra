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
  iddeporte: number;
  idnivel: number;
  deporte: string; // nombre que llega de la API
  nivel: string; // nombre que llega de la API
  color: string; // color HEX del deporte (viene desde la BD)
}

interface DeporteOption {
  iddeporte: number;
  nombre: string;
  color: string;
}

interface NivelOption {
  idnivel: number;
  iddeporte: number;
  nombre_nivel: string;
}

interface HorariosListResponse {
  success: boolean;
  horarios?: Horario[];
  error?: string;
}

interface MetaResponse {
  success: boolean;
  deportes?: DeporteOption[];
  niveles?: NivelOption[];
  error?: string;
}

const API_BASE = "http://localhost/GymSerra/public";

const HorariosDashboard: React.FC = () => {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [deportes, setDeportes] = useState<DeporteOption[]>([]);
  const [niveles, setNiveles] = useState<NivelOption[]>([]);

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [form, setForm] = useState<{
    idhorario: number;
    hora_inicio: number;
    hora_fin: number;
    dia: number;
    iddeporte: number;
    idnivel: number;
  }>({
    idhorario: 0,
    hora_inicio: 0,
    hora_fin: 0,
    dia: 1,
    iddeporte: 0,
    idnivel: 0,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const horas = [
    1430, 1500, 1530, 1600, 1630, 1700, 1730, 1800, 1830, 1900, 1930, 2000,
  ];

  // --------- Helpers ---------
  const formatearHora = (h: number) => {
    const hh = Math.floor(h / 100);
    const mm = h % 100;
    return `${hh.toString().padStart(2, "0")}:${mm
      .toString()
      .padStart(2, "0")}`;
  };

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 2500);
  };

  // --------- Fetch data ---------
  const fetchHorarios = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/horarios.php?action=list`);
      if (!response.ok) throw new Error("Error en la respuesta de la API");
      const data: HorariosListResponse = await response.json();
      if (data.success && data.horarios) {
        setHorarios(data.horarios);
      } else {
        showAlert("error", data.error || "Error al cargar los horarios");
      }
    } catch (error) {
      console.error("Error al obtener horarios:", error);
      showAlert("error", "Error al cargar los horarios");
    }
  };

  const fetchMeta = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/horarios.php?action=meta`);
      if (!response.ok) throw new Error("Error en meta horarios");
      const data: MetaResponse = await response.json();
      if (data.success) {
        setDeportes(data.deportes || []);
        setNiveles(data.niveles || []);
      } else {
        console.error("Error meta horarios:", data.error);
      }
    } catch (error) {
      console.error("Error meta horarios:", error);
    }
  };

  useEffect(() => {
    fetchHorarios();
    fetchMeta();
  }, []);

  // --------- UI logic ---------
  const handleCellClick = (hora: number, dia: number) => {
    const horario = horarios.find(
      (h) => Number(h.hora_inicio) === hora && Number(h.dia) === dia
    );

    if (horario) {
      setForm({
        idhorario: horario.idhorario,
        hora_inicio: horario.hora_inicio,
        hora_fin: horario.hora_fin,
        dia: horario.dia,
        iddeporte: horario.iddeporte,
        idnivel: horario.idnivel,
      });
    } else {
      setForm({
        idhorario: 0,
        hora_inicio: hora,
        hora_fin: hora + 30,
        dia,
        iddeporte: 0,
        idnivel: 0,
      });
    }

    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.iddeporte || !form.idnivel) {
      showAlert("error", "Debe seleccionar un deporte y nivel");
      return;
    }

    const payload = {
      idhorario: form.idhorario || undefined,
      hora_inicio: form.hora_inicio,
      hora_fin: form.hora_fin,
      dia: form.dia,
      iddeporte: form.iddeporte,
      idnivel: form.idnivel,
    };

    const action = form.idhorario ? "update" : "create";
    try {
      const response = await fetch(
        `${API_BASE}/api/horarios.php?action=${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data: { success: boolean; error?: string } = await response.json();
      if (data.success) {
        showAlert(
          "success",
          form.idhorario ? "Horario actualizado" : "Horario creado"
        );
        fetchHorarios();
        setIsDialogOpen(false);
      } else {
        showAlert("error", data.error || "No se pudo guardar");
      }
    } catch (error) {
      console.error("Error al procesar el horario:", error);
      showAlert("error", "Error al procesar el horario");
    }
  };

  // Filtrar niveles por deporte seleccionado
  const nivelesFiltrados = form.iddeporte
    ? niveles.filter((n) => n.iddeporte === form.iddeporte)
    : niveles;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold ">Horario Semanal</h2>

      {alert && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="rounded-lg shadow-sm  border-gray-200"
        >
          {alert.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertTitle className="text-sm font-medium ">
            {alert.type === "success" ? "Éxito" : "Error"}
          </AlertTitle>
          <AlertDescription className="text-sm ">
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabla principal */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm text-center bg-card">
          <thead>
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
                <td className="border p-2 font-medium">{formatearHora(h)}</td>
                {dias.map((_, diaIdx) => {
                  const horario = horarios.find(
                    (x) =>
                      Number(x.hora_inicio) === h &&
                      Number(x.dia) === diaIdx + 1
                  );

                  return (
                    <td
                      key={`${diaIdx}-${h}`}
                      onClick={() => handleCellClick(h, diaIdx + 1)}
                      className="border p-2 cursor-pointer transition-all duration-200 rounded-xs align-top text-black/20"
                      style={
                        horario?.color
                          ? {
                              backgroundColor: horario.color,
                              opacity: 0.7,
                            }
                          : undefined
                      }
                    >
                      {horario ? (
                        <div className="space-y-0.5">
                          <p className="font-semibold text-gray-900 text-xs md:text-sm">
                            {horario.deporte}
                          </p>
                          <p className="text-[11px] text-gray-700">
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
            <DialogTitle className="text-lg font-medium text-gray-50">
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
              <Label className="text-sm font-medium text-gray-200">
                Deporte
              </Label>
              <Select
                value={form.iddeporte ? String(form.iddeporte) : ""}
                onValueChange={(v) =>
                  setForm({ ...form, iddeporte: Number(v), idnivel: 0 })
                }
              >
                <SelectTrigger className="mt-1 rounded-lg border-gray-200">
                  <SelectValue placeholder="Selecciona un deporte" />
                </SelectTrigger>
                <SelectContent>
                  {deportes.map((d) => (
                    <SelectItem key={d.iddeporte} value={String(d.iddeporte)}>
                      {d.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-200">Nivel</Label>
              <Select
                value={form.idnivel ? String(form.idnivel) : ""}
                onValueChange={(v) => setForm({ ...form, idnivel: Number(v) })}
              >
                <SelectTrigger className="mt-1 rounded-lg border-gray-200">
                  <SelectValue placeholder="Selecciona un nivel" />
                </SelectTrigger>
                <SelectContent>
                  {nivelesFiltrados.map((n) => (
                    <SelectItem key={n.idnivel} value={String(n.idnivel)}>
                      {n.nombre_nivel}
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
