import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Pencil, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Alumno {
  idalumno: number;
  nombre_completo: string;
}

interface PlanPago {
  idplan: number;
  idnivel: number;
  dias_por_semana: number;
  costo: number;
  costo_promocion: number;
  costo_penalizacion: number;
}

interface Mensualidad {
  idmensualidad: number;
  idalumno: number | null;
  nombre_alumno: string | null;
  idplan: number | null;
  nombre_deporte: string | null;
  nombre_nivel: string | null;
  dias_por_semana: number | null;
  total_pagado: number | null;
  fecha_pago: string | null;
  estado: string | null;
}

const API_MENS = "http://localhost/GymSerra/public/api/mensualidades.php";
const API_PLANES = "http://localhost/GymSerra/public/api/plan_pago.php";
const safeLower = (v: unknown): string => (v ?? "").toString().toLowerCase();

const NIVELES = [
  { id: 1, nombre: "Gimnasia Inicial (Prenivel)" },
  { id: 2, nombre: "Gimnasia General (Nivel 1 al 4)" },
  { id: 3, nombre: "Parkour" },
];

const MensualidadesDashboard: React.FC = () => {
  const [mensualidades, setMensualidades] = useState<Mensualidad[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [planes, setPlanes] = useState<PlanPago[]>([]);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMensualidad, setCurrentMensualidad] = useState<number | null>(
    null
  );
  const [form, setForm] = useState({
    idalumno: "",
    idplan: "",
    fecha_pago: "",
    total_pagado: "",
  });

  /* ==================== FETCH ==================== */
  const fetchAll = async (): Promise<void> => {
    const [m, a, p] = await Promise.all([
      fetch(`${API_MENS}?action=list`).then((r) => r.json()),
      fetch(`${API_MENS}?action=list_alumnos`).then((r) => r.json()),
      fetch(`${API_PLANES}?action=list`).then((r) => r.json()),
    ]);

    if (m.success) setMensualidades(m.mensualidades as Mensualidad[]);
    if (a.success) setAlumnos(a.alumnos as Alumno[]);
    if (p.success && Array.isArray(p.planes)) {
      const parsed: PlanPago[] = p.planes.map(
        (pl: Record<string, unknown>) => ({
          idplan: Number(pl.idplan),
          idnivel: Number(pl.idnivel),
          dias_por_semana: Number(pl.dias_por_semana),
          costo: Number(pl.costo),
          costo_promocion: Number(pl.costo_promocion),
          costo_penalizacion: Number(pl.costo_penalizacion),
        })
      );
      setPlanes(parsed);
    }
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  /* ==================== BUSCADOR ==================== */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mensualidades;
    return mensualidades.filter(
      (m) =>
        safeLower(m.nombre_alumno).includes(q) ||
        safeLower(m.nombre_deporte).includes(q) ||
        safeLower(m.nombre_nivel).includes(q) ||
        safeLower(m.estado).includes(q)
    );
  }, [search, mensualidades]);

  const pagados = useMemo(
    () => filtered.filter((m) => safeLower(m.estado) === "pagado"),
    [filtered]
  );
  const pendientes = useMemo(
    () => filtered.filter((m) => safeLower(m.estado) !== "pagado"),
    [filtered]
  );

  /* ==================== HELPERS ==================== */
  const recomputeTotalPreview = (planIdStr: string, fecha: string): string => {
    const plan = planes.find((p) => String(p.idplan) === planIdStr);
    if (!plan || !fecha) return "";
    const dia = new Date(fecha).getDate();
    if (dia <= 10) return String(plan.costo_promocion);
    if (dia <= 20) return String(plan.costo);
    return String(plan.costo_penalizacion);
  };

  /* ==================== CRUD ==================== */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setModalError(null);

    const body = {
      idmensualidad: currentMensualidad,
      idalumno: Number(form.idalumno),
      idplan: Number(form.idplan),
      fecha_pago: form.fecha_pago,
    };
    const action = isEditing ? "update" : "create";

    const res = await fetch(`${API_MENS}?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.success) {
      setAlert({
        type: "success",
        message: data.msg || "Mensualidad guardada correctamente.",
      });
      setIsDialogOpen(false);
      setForm({ idalumno: "", idplan: "", fecha_pago: "", total_pagado: "" });
      setCurrentMensualidad(null);
      setIsEditing(false);
      await fetchAll();
    } else {
      setModalError(data.error || "Error al guardar.");
    }

    setTimeout(() => setAlert(null), 3000);
  };

  const handleEdit = (m: Mensualidad): void => {
    setIsEditing(true);
    setCurrentMensualidad(m.idmensualidad);
    setForm({
      idalumno: m.idalumno ? String(m.idalumno) : "",
      idplan: m.idplan ? String(m.idplan) : "",
      fecha_pago: m.fecha_pago ?? "",
      total_pagado: m.total_pagado != null ? String(m.total_pagado) : "",
    });
    setModalError(null);
    setIsDialogOpen(true);
  };

  /* ==================== RENDER ==================== */
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-2xl font-semibold">Control de Mensualidades</h2>

        <div className="flex items-center gap-2 min-w-1/3">
          <div className="relative">
            <Input
              placeholder="Buscar por alumno, deporte, nivel o estado…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm rounded-lg shadow-md"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setForm({
                    idalumno: "",
                    idplan: "",
                    fecha_pago: "",
                    total_pagado: "",
                  });
                  setCurrentMensualidad(null);
                  setIsEditing(false);
                  setModalError(null);
                }}
              >
                + Registrar Pago
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Editar Pago" : "Registrar Pago"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* Alumno */}
                <div>
                  <Label>Alumno</Label>
                  <Select
                    value={form.idalumno}
                    onValueChange={(v) => setForm({ ...form, idalumno: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un alumno" />
                    </SelectTrigger>
                    <SelectContent>
                      {alumnos.map((a) => (
                        <SelectItem key={a.idalumno} value={String(a.idalumno)}>
                          {a.nombre_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Plan agrupado por nivel */}
                <div>
                  <Label>Plan de pago</Label>
                  <Select
                    value={form.idplan}
                    onValueChange={(v) => {
                      const total = recomputeTotalPreview(v, form.fecha_pago);
                      setForm({ ...form, idplan: v, total_pagado: total });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {NIVELES.map((n) => {
                        const groupItems = planes.filter(
                          (p) => p.idnivel === n.id
                        );
                        if (groupItems.length === 0) return null;
                        return (
                          <SelectGroup key={n.id}>
                            <SelectLabel>{n.nombre}</SelectLabel>
                            {groupItems.map((p) => (
                              <SelectItem
                                key={p.idplan}
                                value={String(p.idplan)}
                              >
                                {`${p.dias_por_semana} días • $${p.costo}`}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fecha */}
                <div>
                  <Label>Fecha de pago</Label>
                  <Input
                    type="date"
                    value={form.fecha_pago}
                    onChange={(e) => {
                      const v = e.target.value;
                      const total = recomputeTotalPreview(form.idplan, v);
                      setForm({ ...form, fecha_pago: v, total_pagado: total });
                    }}
                    required
                  />
                </div>

                {/* Total calculado */}
                <div>
                  <Label>Total calculado</Label>
                  <Input type="number" value={form.total_pagado} readOnly />
                </div>

                {/* Error dentro del modal */}
                {modalError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{modalError}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full">
                  {isEditing ? "Actualizar" : "Guardar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {alert && (
        <Alert variant={alert.type === "success" ? "default" : "destructive"}>
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

      {/* TABLAS */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Alumnos con deuda</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Deporte</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendientes.map((m) => (
                  <TableRow key={m.idmensualidad}>
                    <TableCell>{m.nombre_alumno ?? "—"}</TableCell>
                    <TableCell>{m.nombre_deporte ?? "—"}</TableCell>
                    <TableCell>{m.nombre_nivel ?? "—"}</TableCell>
                    <TableCell>{m.fecha_pago ?? "—"}</TableCell>
                    <TableCell>
                      {m.total_pagado != null ? `$${m.total_pagado}` : "—"}
                    </TableCell>
                    <TableCell>{m.estado ?? "—"}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(m)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alumnos al corriente</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Deporte</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagados.map((m) => (
                  <TableRow key={m.idmensualidad}>
                    <TableCell>{m.nombre_alumno ?? "—"}</TableCell>
                    <TableCell>{m.nombre_deporte ?? "—"}</TableCell>
                    <TableCell>{m.nombre_nivel ?? "—"}</TableCell>
                    <TableCell>{m.fecha_pago ?? "—"}</TableCell>
                    <TableCell>
                      {m.total_pagado != null ? `$${m.total_pagado}` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MensualidadesDashboard;
