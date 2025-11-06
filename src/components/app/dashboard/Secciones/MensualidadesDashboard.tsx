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
} from "@/components/ui/select";
import { Pencil, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/* ===== Tipos (permitimos null porque la API puede regresarlos null) ===== */
interface Alumno {
  idalumno: number;
  nombre_completo: string;
}
interface PlanPago {
  idplan: number;
  nombre_deporte: string;
  nombre_nivel: string;
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

const api = "http://localhost/GymSerra/public/api/mensualidades.php";

const safeLower = (v: unknown) => (v ?? "").toString().toLowerCase();

const MensualidadesDashboard: React.FC = () => {
  const [mensualidades, setMensualidades] = useState<Mensualidad[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [planes, setPlanes] = useState<PlanPago[]>([]);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMensualidad, setCurrentMensualidad] = useState<number | null>(
    null
  ); // <-- ahora sí se usa
  const [form, setForm] = useState({
    idalumno: "",
    idplan: "",
    fecha_pago: "",
    total_pagado: "",
  });

  /* ==================== FETCH ==================== */
  const fetchAll = async () => {
    const [m, a, p] = await Promise.all([
      fetch(`${api}?action=list`).then((r) => r.json()),
      fetch(`${api}?action=list_alumnos`).then((r) => r.json()),
      fetch(`${api}?action=list_planes`).then((r) => r.json()),
    ]);
    if (m.success) setMensualidades(m.mensualidades);
    if (a.success) setAlumnos(a.alumnos);
    if (p.success) setPlanes(p.planes);
  };

  useEffect(() => {
    void fetchAll();
  }, []);

  /* ==================== BUSCADOR null-safe ==================== */
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

  /* ==================== CRUD ==================== */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const body = {
      idmensualidad: currentMensualidad,
      idalumno: Number(form.idalumno),
      idplan: Number(form.idplan),
      fecha_pago: form.fecha_pago,
      // total_pagado lo calcula el backend con base en fecha y plan
    };

    const action = isEditing ? "update" : "create";
    const res = await fetch(`${api}?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.success) {
      setAlert({
        type: "success",
        message: "Mensualidad guardada correctamente.",
      });
      setIsDialogOpen(false);
      setForm({ idalumno: "", idplan: "", fecha_pago: "", total_pagado: "" });
      setCurrentMensualidad(null);
      setIsEditing(false);
      await fetchAll();
    } else {
      setAlert({ type: "error", message: data.error || "Error al guardar." });
    }
    setTimeout(() => setAlert(null), 2500);
  };

  const handleEdit = (m: Mensualidad) => {
    setIsEditing(true);
    setCurrentMensualidad(m.idmensualidad); // <-- uso explícito del setter
    setForm({
      idalumno: m.idalumno ? String(m.idalumno) : "",
      idplan: m.idplan ? String(m.idplan) : "",
      fecha_pago: m.fecha_pago ?? "",
      total_pagado: m.total_pagado != null ? String(m.total_pagado) : "",
    });
    setIsDialogOpen(true);
  };

  /* ==================== Cálculo total en el cliente (preview) ==================== */
  const recomputeTotalPreview = (planIdStr: string, fecha: string) => {
    const plan = planes.find((p) => String(p.idplan) === planIdStr);
    if (!plan || !fecha) return "";
    const dia = new Date(fecha).getDate();
    if (dia <= 10) return String(plan.costo_promocion);
    if (dia <= 20) return String(plan.costo);
    return String(plan.costo_penalizacion);
  };

  /* ==================== RENDER ==================== */
  return (
    <div className="p-6 space-y-6">
      {/* Header + Acciones */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-2xl font-semibold">Control de Mensualidades</h2>

        {/* Buscador estilo ArticulosDashboard */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Buscar por alumno, deporte, nivel o estado…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-8"
            />
            <Search className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 opacity-60" />
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

                {/* Plan de pago (mostrar deporte • nivel • días • $costo) */}
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
                      {planes.map((p) => (
                        <SelectItem key={p.idplan} value={String(p.idplan)}>
                          {p.nombre_deporte} • {p.nombre_nivel} •{" "}
                          {p.dias_por_semana} días • ${p.costo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fecha de pago */}
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

                {/* Total (solo lectura, lo definitivo lo calcula el backend) */}
                <div>
                  <Label>Total calculado</Label>
                  <Input type="number" value={form.total_pagado} readOnly />
                </div>

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

      {/* Dos tablas lado a lado como en tus dashboards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pendientes / Vencidos */}
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

        {/* Pagados */}
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
