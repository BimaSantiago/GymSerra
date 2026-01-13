import React, { useEffect, useMemo, useState, useRef } from "react";

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
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Command,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

interface Alumno {
  idalumno: number;
  nombre_completo: string;
  edad: number;
}

interface PlanPago {
  idplan: number;
  iddeporte: number;
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
  nombre_nivel: string | null; // ya no se muestra en tabla, pero lo dejamos por compatibilidad
  dias_por_semana: number | null;
  total_pagado: number | null;
  fecha_pago: string | null;
  estado: string | null;
}

const API_MENS = "https://academiagymserra.garzas.store/api/mensualidades.php";
const API_PLANES = "https://academiagymserra.garzas.store/api/plan_pago.php";

const safeLower = (v: unknown): string => (v ?? "").toString().toLowerCase();

const DEPORTES = [
  { id: 1, nombre: "Gimnasia Inicial" },
  { id: 2, nombre: "Gimnasia Artística" },
  { id: 3, nombre: "Parkour" },
  { id: 4, nombre: "Crossfit" },
  { id: 5, nombre: "Libre" },
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
  const [form, setForm] = useState({
    idalumno: "",
    idplan: "",
    fecha_pago: "",
    total_pagado: "",
  });

  // estados para el selector con búsqueda de alumnos
  const [searchAlumno, setSearchAlumno] = useState("");
  const [filteredAlumnos, setFilteredAlumnos] = useState<Alumno[]>([]);
  const [isAlumnoMenuOpen, setIsAlumnoMenuOpen] = useState(false);
  const alumnoMenuRef = useRef<HTMLDivElement | null>(null);

  // paginación
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  /* ==================== FETCH ==================== */

  // mensualidades con paginación + búsqueda
  const fetchMensualidades = async (): Promise<void> => {
    try {
      const res = await fetch(
        `${API_MENS}?action=list&page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`
      );
      const data = await res.json();

      if (data.success && Array.isArray(data.mensualidades)) {
        setMensualidades(data.mensualidades as Mensualidad[]);
        setTotal(Number(data.total ?? data.mensualidades.length));
      } else {
        setAlert({
          type: "error",
          message: data.error || "Error al cargar mensualidades.",
        });
      }
    } catch (err) {
      console.error(err);
      setAlert({
        type: "error",
        message: "Error de conexión al cargar mensualidades.",
      });
    }
  };

  // alumnos + planes (una sola vez)
  const fetchStaticData = async (): Promise<void> => {
    try {
      const [a, p] = await Promise.all([
        fetch(`${API_MENS}?action=list_alumnos`).then((r) => r.json()),
        fetch(`${API_PLANES}?action=list`).then((r) => r.json()),
      ]);

      if (a.success && Array.isArray(a.alumnos)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lista: Alumno[] = a.alumnos.map((al: any) => ({
          idalumno: Number(al.idalumno),
          nombre_completo: String(al.nombre_completo),
          edad: Number(al.edad ?? 0),
        }));
        setAlumnos(lista);
        setFilteredAlumnos(lista);
      }

      if (p.success && Array.isArray(p.planes)) {
        const parsed: PlanPago[] = p.planes.map(
          (pl: Record<string, unknown>) => ({
            idplan: Number(pl.idplan),
            iddeporte: Number(pl.iddeporte),
            dias_por_semana: Number(pl.dias_por_semana),
            costo: Number(pl.costo),
            costo_promocion: Number(pl.costo_promocion),
            costo_penalizacion: Number(pl.costo_penalizacion),
          })
        );
        setPlanes(parsed);
      }
    } catch (err) {
      console.error(err);
      setAlert({
        type: "error",
        message: "Error al cargar información.",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  // datos estáticos
  useEffect(() => {
    void fetchStaticData();
  }, []);

  // mensualidades (paginado + búsqueda)
  useEffect(() => {
    void fetchMensualidades();
  }, [page, search]);

  // Filtrado de alumnos para el command
  useEffect(() => {
    const term = searchAlumno.toLowerCase();
    const filtered = alumnos.filter((al) =>
      al.nombre_completo.toLowerCase().includes(term)
    );
    setFilteredAlumnos(filtered);
  }, [searchAlumno, alumnos]);

  // Cerrar menú de alumnos al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        alumnoMenuRef.current &&
        !alumnoMenuRef.current.contains(e.target as Node)
      ) {
        setIsAlumnoMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ==================== DERIVADOS ==================== */

  /* ==================== DERIVADOS ==================== */

  // Para cada alumno, tomar solo su mensualidad más reciente
  const mensualidadRecientePorAlumno = useMemo(() => {
    const map = new Map<number, Mensualidad>();

    mensualidades.forEach((m) => {
      if (m.idalumno == null) return;

      const actual = map.get(m.idalumno);

      // Parseo seguro de fechas
      const fechaNueva = m.fecha_pago ? new Date(m.fecha_pago) : null;
      const fechaActual = actual?.fecha_pago
        ? new Date(actual.fecha_pago)
        : null;

      if (!actual) {
        // Primer registro que vemos de este alumno
        map.set(m.idalumno, m);
      } else if (fechaNueva && !fechaActual) {
        // El nuevo tiene fecha y el actual no
        map.set(m.idalumno, m);
      } else if (fechaNueva && fechaActual && fechaNueva > fechaActual) {
        // El nuevo es más reciente por fecha_pago
        map.set(m.idalumno, m);
      } else if (!fechaNueva && !fechaActual) {
        // Si ninguna tiene fecha, usar el idmensualidad como fallback
        if ((m.idmensualidad ?? 0) > (actual.idmensualidad ?? 0)) {
          map.set(m.idalumno, m);
        }
      }
    });

    return Array.from(map.values());
  }, [mensualidades]);

  // "Al corriente": mensualidad más reciente con estado = Pagado
  const pagados = useMemo(
    () =>
      mensualidadRecientePorAlumno.filter(
        (m) => safeLower(m.estado) === "pagado"
      ),
    [mensualidadRecientePorAlumno]
  );

  // "Con deuda": mensualidad más reciente con estado != Pagado
  const pendientes = useMemo(
    () =>
      mensualidadRecientePorAlumno.filter(
        (m) => safeLower(m.estado) !== "pagado"
      ),
    [mensualidadRecientePorAlumno]
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));

  /* ==================== HELPERS ==================== */

  const recomputeTotalPreview = (planIdStr: string, fecha: string): string => {
    const plan = planes.find((p) => String(p.idplan) === planIdStr);
    if (!plan || !fecha) return "";
    const dia = new Date(fecha).getDate();
    if (dia <= 10) return String(plan.costo_promocion);
    if (dia <= 20) return String(plan.costo);
    return String(plan.costo_penalizacion);
  };

  /* ==================== CREAR (SIN MODIFICAR) ==================== */

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setModalError(null);

    const selectedAlumnoId = Number(form.idalumno);
    const selectedPlanId = Number(form.idplan);

    const alumnoInfo = alumnos.find((a) => a.idalumno === selectedAlumnoId);
    const planInfo = planes.find((p) => p.idplan === selectedPlanId);

    if (!alumnoInfo || !planInfo) {
      setModalError("Debes seleccionar un alumno y un plan válidos.");
      return;
    }

    // Regla: Gimnasia Inicial (iddeporte = 1) no permite alumnos > 12 años
    if (planInfo.iddeporte === 1 && alumnoInfo.edad > 12) {
      setModalError(
        "No se puede registrar un pago de Gimnasia Inicial para alumnos mayores de 12 años."
      );
      return;
    }

    const body = {
      idalumno: selectedAlumnoId,
      idplan: selectedPlanId,
      fecha_pago: form.fecha_pago,
    };
    const action = "create"; // 🔒 siempre create, no se permite modificar

    try {
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
        setForm({
          idalumno: "",
          idplan: "",
          fecha_pago: "",
          total_pagado: "",
        });
        setSearchAlumno("");
        setIsAlumnoMenuOpen(false);
        await fetchMensualidades();
      } else {
        setModalError(data.error || "Error al guardar.");
      }
    } catch (err) {
      console.error(err);
      setModalError("Error de conexión al guardar.");
    }

    setTimeout(() => setAlert(null), 3000);
  };

  /* ==================== RENDER ==================== */

  return (
    <div className="p-6 space-y-6">
      {/* Header + buscador + botón */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-semibold text-primary/80">Control de Mensualidades</h1>

        <div className="flex items-center gap-2 min-w-1/3">
          <div className="relative">
            <Input
              placeholder="Buscar por alumno, deporte o estado…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
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
                  setModalError(null);
                  setSearchAlumno("");
                  setIsAlumnoMenuOpen(false);
                }}
                className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg"
              >
                Registrar Pago
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Registrar Pago</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* Alumno con Command + búsqueda */}
                <div className="relative" ref={alumnoMenuRef}>
                  <Label>Alumno</Label>
                  <div
                    className="flex items-center justify-between border rounded-lg px-3 py-2  cursor-text hover:border-gray-400 transition"
                    onClick={() => setIsAlumnoMenuOpen(true)}
                  >
                    <input
                      type="text"
                      placeholder="Seleccionar alumno..."
                      value={
                        isAlumnoMenuOpen
                          ? searchAlumno
                          : form.idalumno
                          ? alumnos.find(
                              (a) => a.idalumno === Number(form.idalumno)
                            )?.nombre_completo || ""
                          : ""
                      }
                      onFocus={() => setIsAlumnoMenuOpen(true)}
                      onChange={(e) => {
                        setSearchAlumno(e.target.value);
                        setIsAlumnoMenuOpen(true);
                      }}
                      className="w-full outline-none bg-transparent text-sm"
                    />
                  </div>

                  {isAlumnoMenuOpen && (
                    <div className="absolute z-50 mt-1 w-full border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      <Command>
                        <CommandList>
                          {filteredAlumnos.length > 0 ? (
                            filteredAlumnos.map((a) => (
                              <CommandItem
                                key={a.idalumno}
                                onSelect={() => {
                                  setForm({
                                    ...form,
                                    idalumno: String(a.idalumno),
                                  });
                                  setSearchAlumno("");
                                  setIsAlumnoMenuOpen(false);
                                }}
                                className="cursor-pointer hover:bg-accent px-3 py-2"
                              >
                                <span className="text-sm">
                                  {a.nombre_completo} {`(Edad: ${a.edad} años)`}
                                </span>
                              </CommandItem>
                            ))
                          ) : (
                            <CommandEmpty className="px-3 py-2 text-gray-500">
                              No se encontraron alumnos.
                            </CommandEmpty>
                          )}
                        </CommandList>
                      </Command>
                    </div>
                  )}
                </div>

                {/* Plan agrupado por deporte */}
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
                      {DEPORTES.map((d) => {
                        const groupItems = planes.filter(
                          (p) => p.iddeporte === d.id
                        );
                        if (groupItems.length === 0) return null;
                        return (
                          <SelectGroup key={d.id}>
                            <SelectLabel>{d.nombre}</SelectLabel>
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
                    className="text-white appearance-none"
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

                <Button
                  type="submit"
                  className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg w-full"
                >
                  Guardar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alert global */}
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

      {/* TABLAS EN TABS */}
      <Tabs defaultValue="pendientes" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pendientes">Alumnos con deuda</TabsTrigger>
          <TabsTrigger value="pagados">Alumnos al corriente</TabsTrigger>
        </TabsList>

        {/* PENDIENTES: sin nivel, sin edición */}
        <TabsContent value="pendientes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Alumnos con adeudo de mensualidades</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Deporte</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendientes.map((m) => (
                    <TableRow key={m.idmensualidad}>
                      <TableCell>{m.nombre_alumno ?? "—"}</TableCell>
                      <TableCell>{m.nombre_deporte ?? "—"}</TableCell>
                      <TableCell>{m.fecha_pago ?? "—"}</TableCell>
                      <TableCell>
                        {m.total_pagado != null ? `$${m.total_pagado}` : "—"}
                      </TableCell>
                      <TableCell>{m.estado ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {pendientes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm">
                        No hay alumnos con deuda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAGADOS: sin nivel y SIN botón de editar */}
        <TabsContent value="pagados" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Alumnos con pagos de mensualidades al dia</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Deporte</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagados.map((m) => (
                    <TableRow key={m.idmensualidad}>
                      <TableCell>{m.nombre_alumno ?? "—"}</TableCell>
                      <TableCell>{m.nombre_deporte ?? "—"}</TableCell>
                      <TableCell>{m.fecha_pago ?? "—"}</TableCell>
                      <TableCell>
                        {m.total_pagado != null ? `$${m.total_pagado}` : "—"}
                      </TableCell>
                      <TableCell>{m.estado ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {pagados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm">
                        No hay pagos registrados como pagados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Paginación */}
      <div className="flex justify-between items-center mt-4">
        <Button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg"
        >
          Anterior
        </Button>

        <span className="text-sm text-gray-100">
          Página {page} de {totalPages}
        </span>

        <Button
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage((p) => p + 1)}
          className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};

export default MensualidadesDashboard;
