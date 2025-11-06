import React, { useEffect, useState } from "react";
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

interface PlanPago {
  idplan: number;
  idnivel: number;
  dias_por_semana: number;
  costo: number;
  costo_promocion: number;
  costo_penalizacion: number;
}

interface ApiResponse {
  success?: boolean;
  error?: string;
  planes?: PlanPago[];
  idplan?: number;
}

const PlanPagoDashboard: React.FC = () => {
  const [planes, setPlanes] = useState<PlanPago[]>([]);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);

  const [form, setForm] = useState({
    idnivel: "",
    dias_por_semana: "",
    costo: "",
    costo_promocion: "",
    costo_penalizacion: "",
  });

  const niveles = [
    { id: 1, nombre: "Gimnasia Inicial (Prenivel)" },
    { id: 2, nombre: "Gimnasia General (Nivel 1 al 4)" },
    { id: 3, nombre: "Parkour" },
  ];

  /* ---------- Fetch de planes ---------- */
  const fetchPlanes = async (): Promise<void> => {
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/plan_pago.php?action=list"
      );
      const data: ApiResponse = await res.json();
      if (data.success && Array.isArray(data.planes)) {
        const parsed = data.planes.map((p) => ({
          ...p,
          idnivel: Number(p.idnivel),
          dias_por_semana: Number(p.dias_por_semana),
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

  useEffect(() => {
    void fetchPlanes();
  }, []);

  /* ---------- Validaciones ---------- */
  const validarDuplicado = (): boolean => {
    const nivel = Number(form.idnivel);
    const dias = Number(form.dias_por_semana);
    return planes.some(
      (p) =>
        p.idnivel === nivel &&
        p.dias_por_semana === dias &&
        (!isEditing || p.idplan !== currentPlanId)
    );
  };

  /* ---------- Guardar (Agregar o Editar) ---------- */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (validarDuplicado()) {
      setAlert({
        type: "error",
        message: "Ya existe un plan con esa cantidad de días para este nivel.",
      });
      return;
    }

    const body = {
      idplan: currentPlanId,
      idnivel: Number(form.idnivel),
      dias_por_semana: Number(form.dias_por_semana),
      costo: Number(form.costo),
      costo_promocion: Number(form.costo_promocion),
      costo_penalizacion: Number(form.costo_penalizacion),
    };

    const action = isEditing ? "update" : "create";

    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/plan_pago.php?action=${action}`,
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
      idnivel: String(plan.idnivel),
      dias_por_semana: String(plan.dias_por_semana),
      costo: String(plan.costo),
      costo_promocion: String(plan.costo_promocion),
      costo_penalizacion: String(plan.costo_penalizacion),
    });
    setIsDialogOpen(true);
  };

  const resetForm = (): void => {
    setForm({
      idnivel: "",
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
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
          Planes de Pago
        </h2>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="default"
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
              <div className="grid gap-3">
                <Label>Nivel</Label>
                <Select
                  value={form.idnivel}
                  onValueChange={(v) => setForm({ ...form, idnivel: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {niveles.map((n) => (
                      <SelectItem key={n.id} value={String(n.id)}>
                        {n.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                      setForm({ ...form, costo_penalizacion: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-2">
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {niveles.map((nivel) => {
          const planesNivel = planes.filter((p) => p.idnivel === nivel.id);
          return (
            <Card
              key={nivel.id}
              className="rounded-xl border shadow-sm hover:shadow-md transition-shadow"
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
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {planesNivel.map((p) => (
                        <TableRow key={p.idplan}>
                          <TableCell>{p.dias_por_semana}</TableCell>
                          <TableCell>${p.costo_promocion}</TableCell>
                          <TableCell>${p.costo}</TableCell>
                          <TableCell>${p.costo_penalizacion}</TableCell>
                          <TableCell className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(p)}
                            >
                              <Pencil className="h-4 w-4 text-gray-700" />
                            </Button>
                          </TableCell>
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
    </div>
  );
};

export default PlanPagoDashboard;
