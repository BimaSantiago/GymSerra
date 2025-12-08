import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Pencil, CheckCircle2, AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const API_BASE = "http://localhost/GymSerra/public";

interface PlanPago {
  idplan: number;
  iddeporte: number;
  dias_por_semana: number;
  costo: number;
  costo_promocion: number;
  costo_penalizacion: number;
  deporte: string;
}

interface PlanPagoApiRow {
  idplan: number;
  iddeporte: number | string;
  dias_por_semana: number | string;
  costo: number | string;
  costo_promocion: number | string;
  costo_penalizacion: number | string;
  deporte: string;
}

interface ApiResponse {
  success?: boolean;
  error?: string;
  planes?: PlanPagoApiRow[];
  idplan?: number;
}

interface Deporte {
  iddeporte: number;
  nombre: string;
  color: string;
}

interface DeportesResponse {
  success?: boolean;
  error?: string;
  deportes?: Deporte[];
}

const PlanPagoDashboard: React.FC = () => {
  const [planes, setPlanes] = useState<PlanPago[]>([]);
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  const [selectedDeporte, setSelectedDeporte] = useState<string>("");

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);

  const [form, setForm] = useState({
    iddeporte: "",
    dias_por_semana: "",
    costo: "",
    costo_promocion: "",
    costo_penalizacion: "",
  });

  /* ---------- Fetch de planes ---------- */
  const fetchPlanes = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/api/plan_pago.php?action=list`);
      const data: ApiResponse = await res.json();

      if (data.success && Array.isArray(data.planes)) {
        const parsed: PlanPago[] = data.planes.map((p) => ({
          idplan: Number(p.idplan),
          iddeporte: Number(p.iddeporte),
          dias_por_semana: Number(p.dias_por_semana),
          costo: Number(p.costo),
          costo_promocion: Number(p.costo_promocion),
          costo_penalizacion: Number(p.costo_penalizacion),
          deporte: p.deporte,
        }));
        setPlanes(parsed);
      } else {
        setAlert({
          type: "error",
          message: data.error ?? "Error al obtener planes",
        });
      }
    } catch {
      setAlert({ type: "error", message: "Error de conexión con el servidor" });
    }
  };

  /* ---------- Fetch de deportes (para Tabs y Select) ---------- */
  const fetchDeportes = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/api/deportes.php?action=list`);
      const data: DeportesResponse = await res.json();
      if (data.success && Array.isArray(data.deportes)) {
        setDeportes(data.deportes);
      } else if (data.error) {
        console.error("Error al obtener deportes:", data.error);
      }
    } catch (error) {
      console.error("Error de conexión al obtener deportes:", error);
    }
  };

  useEffect(() => {
    void fetchPlanes();
    void fetchDeportes();
  }, []);

  // Deportes que SÍ tienen al menos un plan
  const deportesConPlanes = useMemo(
    () =>
      deportes.filter((d) => planes.some((p) => p.iddeporte === d.iddeporte)),
    [deportes, planes]
  );

  // Asegurar que el deporte seleccionado siempre sea uno que tenga planes
  useEffect(() => {
    if (deportesConPlanes.length === 0) {
      setSelectedDeporte("");
      return;
    }

    // Si no hay seleccionado o el seleccionado ya no tiene planes, escoger el primero
    const actualEsValido = deportesConPlanes.some(
      (d) => String(d.iddeporte) === selectedDeporte
    );

    if (!selectedDeporte || !actualEsValido) {
      setSelectedDeporte(String(deportesConPlanes[0].iddeporte));
    }
  }, [deportesConPlanes, selectedDeporte]);

  /* ---------- Validaciones ---------- */
  const validarDuplicado = (): boolean => {
    const deporteId = Number(form.iddeporte);
    const dias = Number(form.dias_por_semana);
    return planes.some(
      (p) =>
        p.iddeporte === deporteId &&
        p.dias_por_semana === dias &&
        (!isEditing || p.idplan !== currentPlanId)
    );
  };

  /* ---------- Guardar (Agregar o Editar) ---------- */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.iddeporte || !form.dias_por_semana) {
      setAlert({
        type: "error",
        message: "Debe seleccionar un deporte y los días por semana.",
      });
      setTimeout(() => setAlert(null), 2500);
      return;
    }

    if (validarDuplicado()) {
      setAlert({
        type: "error",
        message:
          "Ya existe un plan con esa cantidad de días para este deporte.",
      });
      setTimeout(() => setAlert(null), 2500);
      return;
    }

    const body = {
      idplan: currentPlanId,
      iddeporte: Number(form.iddeporte),
      dias_por_semana: Number(form.dias_por_semana),
      costo: Number(form.costo),
      costo_promocion: Number(form.costo_promocion || 0),
      costo_penalizacion: Number(form.costo_penalizacion || 0),
    };

    const action = isEditing ? "update" : "create";

    try {
      const res = await fetch(
        `${API_BASE}/api/plan_pago.php?action=${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data: ApiResponse = await res.json();

      if (data.success) {
        setAlert({
          type: "success",
          message: isEditing
            ? "Plan actualizado correctamente"
            : "Plan agregado correctamente",
        });
        setIsDialogOpen(false);
        resetForm();
        await fetchPlanes();
      } else {
        setAlert({
          type: "error",
          message: data.error ?? "Error al guardar plan",
        });
      }
    } catch {
      setAlert({ type: "error", message: "Error de conexión con el servidor" });
    }
    setTimeout(() => setAlert(null), 2500);
  };

  const handleEdit = (plan: PlanPago): void => {
    setIsEditing(true);
    setCurrentPlanId(plan.idplan);
    setForm({
      iddeporte: String(plan.iddeporte),
      dias_por_semana: String(plan.dias_por_semana),
      costo: String(plan.costo),
      costo_promocion: String(plan.costo_promocion),
      costo_penalizacion: String(plan.costo_penalizacion),
    });
    setIsDialogOpen(true);
  };

  const resetForm = (): void => {
    setForm({
      iddeporte: "",
      dias_por_semana: "",
      costo: "",
      costo_promocion: "",
      costo_penalizacion: "",
    });
    setIsEditing(false);
    setCurrentPlanId(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-200">
          Planes de Pago
        </h2>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="submit"
              className=" bg-gray-800 text-white hover:bg-gray-700 rounded-lg shadow-sm"
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
            >
              Nuevo Plan
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Plan" : "Nuevo Plan de Pago"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Deporte */}
              <div className="grid gap-3">
                <Label>Deporte</Label>
                <Select
                  value={form.iddeporte}
                  onValueChange={(v) => setForm({ ...form, iddeporte: v })}
                >
                  <SelectTrigger>
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

              {/* Días por semana */}
              <div className="grid gap-3">
                <Label>Días por semana</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.dias_por_semana}
                  onChange={(e) =>
                    setForm({ ...form, dias_por_semana: e.target.value })
                  }
                  placeholder="Ej. 3"
                  required
                />
              </div>

              {/* Promoción */}
              <div className="grid gap-2">
                <Label>Promoción</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.costo_promocion}
                  onChange={(e) =>
                    setForm({ ...form, costo_promocion: e.target.value })
                  }
                />
              </div>

              {/* Costos */}
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Costo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.costo}
                    onChange={(e) =>
                      setForm({ ...form, costo: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Penalización</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.costo_penalizacion}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        costo_penalizacion: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-2 bg-gray-800 hover:bg-gray-700 text-white"
              >
                {isEditing ? "Actualizar Plan" : "Guardar Plan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {alert && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="rounded-lg border"
        >
          {alert.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {alert.type === "success" ? "Éxito" : "Error"}
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {deportesConPlanes.length === 0 ? (
        <p className="text-sm text-gray-500">
          No hay planes de pago registrados todavía.
        </p>
      ) : (
        <Tabs
          value={
            selectedDeporte ||
            (deportesConPlanes[0] ? String(deportesConPlanes[0].iddeporte) : "")
          }
          onValueChange={setSelectedDeporte}
          className="w-full"
        >
          <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1">
            {deportesConPlanes.map((d) => (
              <TabsTrigger
                key={d.iddeporte}
                value={String(d.iddeporte)}
                className="px-3 py-1 text-sm"
              >
                {d.nombre}
              </TabsTrigger>
            ))}
          </TabsList>

          {deportesConPlanes.map((d) => {
            const planesDeporte = planes.filter(
              (p) => p.iddeporte === d.iddeporte
            );

            return (
              <TabsContent
                key={d.iddeporte}
                value={String(d.iddeporte)}
                className="mt-4"
              >
                <Card className="rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-50 flex items-center gap-2">
                      Planes de {d.nombre}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {planesDeporte.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Días</TableHead>
                            <TableHead>Promoción</TableHead>
                            <TableHead>Costo</TableHead>
                            <TableHead>Penalización</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {planesDeporte.map((p) => (
                            <TableRow key={p.idplan}>
                              <TableCell>{p.dias_por_semana}</TableCell>
                              <TableCell>${p.costo_promocion}</TableCell>
                              <TableCell>${p.costo}</TableCell>
                              <TableCell>${p.costo_penalizacion}</TableCell>
                              <TableCell className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(p)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-gray-100">
                        No hay planes registrados para este deporte.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
};

export default PlanPagoDashboard;
