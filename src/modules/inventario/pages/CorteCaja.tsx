import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Lock,
  CalendarDays,
  Clock3,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CorteTipoUI = "X" | "Z";

interface CorteCajaItem {
  idcorte: number;
  folio: string;
  fecha_inicio: string;
  fecha_corte: string | null;
  total_vendido: number | null;
  tipo?: string;
  corte_principal?: number | null;
}

interface Venta {
  idmovimiento: number;
  fecha: string;
  total: number;
}

const API_BASE = "https://academiagymserra.garzas.store/api/corte_caja.php";

function formatMoney(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(n ?? 0));
}

function formatDateTime(s?: string | null): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return s;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <div className="text-xs text-muted-foreground mb-2 font-medium">
        {String(label)}
      </div>
      <div className="space-y-1">
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload.map((item: any, idx: number) => {
            const c = item?.fill || item?.stroke || item?.color || "#10b981";
            return (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: c }}
                />
                <span className="text-sm font-semibold">
                  {formatMoney(Number(item?.value ?? 0))}
                </span>
              </div>
            );
          })
        }
      </div>
    </div>
  );
};

const CorteCaja = () => {
  const navigate = useNavigate();

  const [tab, setTab] = useState<CorteTipoUI>("X");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [pageX, setPageX] = useState(1);
  const [pageZ, setPageZ] = useState(1);
  const limit = 10;

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [currentX, setCurrentX] = useState<CorteCajaItem | null>(null);
  const [currentZ, setCurrentZ] = useState<CorteCajaItem | null>(null);

  const [cortesX, setCortesX] = useState<CorteCajaItem[]>([]);
  const [cortesZ, setCortesZ] = useState<CorteCajaItem[]>([]);
  const [turnosDelDia, setTurnosDelDia] = useState<CorteCajaItem[]>([]);
  const [totalX, setTotalX] = useState(0);
  const [totalZ, setTotalZ] = useState(0);
  const [ventasX, setVentasX] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados para diálogos de confirmación
  const [dialogCerrarTurno, setDialogCerrarTurno] = useState(false);
  const [dialogCerrarDia, setDialogCerrarDia] = useState(false);
  const [processingClose, setProcessingClose] = useState(false);

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    window.setTimeout(() => setAlert(null), 4000);
  };

  const fetchCurrent = async () => {
    try {
      const resX = await fetch(`${API_BASE}?action=getCurrent&tipo=X`);
      const dx = await resX.json();
      if (dx.success) setCurrentX(dx.corte ?? null);

      const resZ = await fetch(`${API_BASE}?action=getCurrent&tipo=Z`);
      const dz = await resZ.json();
      if (dz.success) setCurrentZ(dz.corte ?? null);
    } catch {
      showAlert("error", "Error obteniendo cortes actuales");
    }
  };

  const fetchTurnosDelDiaActual = async () => {
    if (!currentZ?.idcorte) {
      setTurnosDelDia([]);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}?action=detalle&idcorte=${currentZ.idcorte}`
      );
      const data = await res.json();
      if (data.success && data.turnos) {
        setTurnosDelDia(data.turnos);
      } else {
        setTurnosDelDia([]);
      }
    } catch {
      setTurnosDelDia([]);
    }
  };

  const fetchList = async (tipo: CorteTipoUI) => {
    const page = tipo === "X" ? pageX : pageZ;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        action: "list",
        tipo,
        page: String(page),
        limit: String(limit),
      });
      if (dateStart) params.append("dateStart", dateStart);
      if (dateEnd) params.append("dateEnd", dateEnd);

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        if (tipo === "X") {
          setCortesX(data.cortes ?? []);
          setTotalX(data.total ?? 0);
        } else {
          setCortesZ(data.cortes ?? []);
          setTotalZ(data.total ?? 0);
        }
      }
    } catch {
      showAlert("error", "Error cargando historial");
    } finally {
      setLoading(false);
    }
  };

  const fetchVentasDeCorteXActual = async (idcorte?: number | null) => {
    if (!idcorte) {
      setVentasX([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}?action=detalle&idcorte=${idcorte}`);
      const data = await res.json();
      if (data.success) {
        setVentasX(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.ventas ?? []).map((v: any) => ({
            ...v,
            total: Number(v.total ?? 0),
          }))
        );
      }
    } catch {
      setVentasX([]);
    }
  };

  useEffect(() => {
    fetchCurrent();
  }, []);

  useEffect(() => {
    fetchList("X");
  }, [pageX]);

  useEffect(() => {
    fetchList("Z");
  }, [pageZ]);

  useEffect(() => {
    fetchList(tab);
  }, [tab]);

  useEffect(() => {
    fetchVentasDeCorteXActual(currentX?.idcorte);
  }, [currentX?.idcorte]);

  useEffect(() => {
    fetchTurnosDelDiaActual();
  }, [currentZ?.idcorte]);

  const handleFiltrar = () => {
    if (tab === "X") setPageX(1);
    else setPageZ(1);
    fetchList(tab);
  };

  const handleLimpiar = () => {
    setDateStart("");
    setDateEnd("");
    handleFiltrar();
  };

  const handleVerDetalle = (idcorte: number) => {
    navigate(`/dashboard/corteCajaDetalle?idcorte=${idcorte}`);
  };

  const handleConfirmCerrarTurno = async () => {
    if (!currentX?.idcorte || currentX.fecha_corte) return;

    setProcessingClose(true);
    try {
      const res = await fetch(`${API_BASE}?action=closeShift`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        showAlert("success", "✓ Turno cerrado correctamente");
        await fetchCurrent();
        await fetchList("X");
        await fetchList("Z");
        await fetchTurnosDelDiaActual();
      } else {
        showAlert("error", data.error || "No se pudo cerrar turno");
      }
    } catch {
      showAlert("error", "Error de conexión");
    } finally {
      setProcessingClose(false);
      setDialogCerrarTurno(false);
    }
  };

  const handleConfirmCerrarDia = async () => {
    if (!currentZ?.idcorte || currentZ.fecha_corte) return;

    setProcessingClose(true);
    try {
      const res = await fetch(`${API_BASE}?action=closeDay`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        showAlert("success", "✓ Día cerrado correctamente");
        await fetchCurrent();
        await fetchList("X");
        await fetchList("Z");
        await fetchTurnosDelDiaActual();
      } else {
        showAlert("error", data.error || "No se pudo cerrar el día");
      }
    } catch {
      showAlert("error", "Error de conexión");
    } finally {
      setProcessingClose(false);
      setDialogCerrarDia(false);
    }
  };

  const ventasPorHora = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of ventasX) {
      const hora = String(v.fecha ?? "").slice(11, 13) || "00";
      map[hora] = (map[hora] ?? 0) + Number(v.total ?? 0);
    }
    const horas = Object.keys(map).sort((a, b) => Number(a) - Number(b));
    return horas.map((h) => ({
      hora: `${h}:00`,
      total: Number(map[h] ?? 0),
    }));
  }, [ventasX]);

  const cortes = tab === "X" ? cortesX : cortesZ;
  const total = tab === "X" ? totalX : totalZ;
  const page = tab === "X" ? pageX : pageZ;
  const setPage = tab === "X" ? setPageX : setPageZ;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto">
        {alert && (
          <Alert
            variant={alert.type === "success" ? "default" : "destructive"}
            className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg"
          >
            {alert.type === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <AlertTitle className="font-bold">
              {alert.type === "success" ? "Operación Exitosa" : "Error"}
            </AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold ">Cortes de Caja</h1>
            <p className="text-muted-foreground mt-1">
              Gestión de turnos y cierres de día
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setDialogCerrarTurno(true)}
              disabled={!currentX?.idcorte || !!currentX?.fecha_corte}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <Lock className="h-4 w-4 mr-2" /> Cerrar Turno (X)
            </Button>
            <Button
              onClick={() => setDialogCerrarDia(true)}
              disabled={!currentZ?.idcorte || !!currentZ?.fecha_corte}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <Lock className="h-4 w-4 mr-2" /> Cerrar Día (Z)
            </Button>
          </div>
        </div>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as CorteTipoUI)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-6 p-1 rounded-xl">
            <TabsTrigger
              value="X"
              className="flex items-center gap-2 rounded-lg transition-all"
            >
              <Clock3 className="h-4 w-4" /> Turnos (X)
            </TabsTrigger>
            <TabsTrigger
              value="Z"
              className="flex items-center gap-2 rounded-lg transition-all"
            >
              <CalendarDays className="h-4 w-4" /> Cierres Día (Z)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="X" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-none shadow-xl bg-secondary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-blue-500" />
                      Turno Actual
                    </span>
                    <Badge
                      variant={currentX?.fecha_corte ? "secondary" : "default"}
                      className="shadow-sm"
                    >
                      {currentX?.fecha_corte ? "CERRADO" : "ABIERTO"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Folio</p>
                    <p className="font-mono text-sm font-medium">
                      {currentX?.folio ?? "—"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Total Vendido
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {formatMoney(Number(currentX?.total_vendido ?? 0))}
                    </p>
                  </div>
                  {currentX?.idcorte && (
                    <Button
                      variant="outline"
                      className="w-full mt-4 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                      onClick={() => handleVerDetalle(currentX!.idcorte)}
                    >
                      <Eye className="h-4 w-4 mr-2" /> Ver Detalle
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-none shadow-xl bg-secondary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Ventas por Hora (Turno Actual)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ventasPorHora}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-gray-200 dark:stroke-gray-700"
                      />
                      <XAxis
                        dataKey="hora"
                        tick={{ fontSize: 12 }}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar
                        dataKey="total"
                        fill="url(#colorGradient)"
                        radius={[8, 8, 0, 0]}
                      />
                      <defs>
                        <linearGradient
                          id="colorGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="Z" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-none shadow-xl bg-secondary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-purple-500" />
                      Día Actual
                    </span>
                    <Badge
                      variant={currentZ?.fecha_corte ? "secondary" : "default"}
                      className="shadow-sm"
                    >
                      {currentZ?.fecha_corte ? "CERRADO" : "ABIERTO"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Folio</p>
                    <p className="font-mono text-sm font-medium">
                      {currentZ?.folio ?? "—"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Total del Día
                    </p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {formatMoney(Number(currentZ?.total_vendido ?? 0))}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2 border-t">
                    Suma de todos los turnos (X) del día
                  </p>
                  {currentZ?.idcorte && (
                    <Button
                      variant="outline"
                      className="w-full hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors"
                      onClick={() => handleVerDetalle(currentZ!.idcorte)}
                    >
                      <Eye className="h-4 w-4 mr-2" /> Ver Detalle
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-none shadow-xl bg-secondary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock3 className="h-5 w-5 text-purple-500" />
                    Turnos del Día Actual ({turnosDelDia.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {turnosDelDia.length > 0 ? (
                    <div className="space-y-2 max-h-[240px] overflow-y-auto">
                      {turnosDelDia.map((turno) => (
                        <div
                          key={turno.idcorte}
                          className="flex items-center justify-between p-3 rounded-lg border bg-accent hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1">
                            <p className="font-mono text-sm font-medium">
                              {turno.folio}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(turno.fecha_inicio)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600 dark:text-green-400">
                              {formatMoney(Number(turno.total_vendido ?? 0))}
                            </p>
                            <Badge
                              variant={
                                turno.fecha_corte ? "secondary" : "default"
                              }
                              className="text-xs"
                            >
                              {turno.fecha_corte ? "Cerrado" : "Abierto"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 space-y-3">
                      <Clock3 className="h-16 w-16 mx-auto text-purple-300 dark:text-purple-700" />
                      <p className="text-muted-foreground font-medium">
                        No hay turnos registrados en este día
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Filtros */}
        <Card className="mt-8 border-none shadow-lg bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">
                  Fecha Inicio
                </label>
                <Input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="shadow-sm"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">
                  Fecha Fin
                </label>
                <Input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="shadow-sm"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleFiltrar} className="shadow-sm">
                  Filtrar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLimpiar}
                  className="shadow-sm"
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card className="mt-6 border-none shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="">
                    <TableHead className="font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Folio</TableHead>
                    <TableHead className="font-semibold">Inicio</TableHead>
                    <TableHead className="font-semibold">Cierre</TableHead>
                    <TableHead className="font-semibold">Total</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="text-center font-semibold">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          <span className="text-muted-foreground">
                            Cargando...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : cortes.length > 0 ? (
                    cortes.map((c) => (
                      <TableRow key={c.idcorte} className=" transition-colors">
                        <TableCell className="font-medium">
                          {c.idcorte}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-800 px-2 py-1 rounded">
                            {c.folio}
                          </code>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(c.fecha_inicio)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(c.fecha_corte)}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600 dark:text-green-400">
                          {formatMoney(Number(c.total_vendido ?? 0))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={!c.fecha_corte ? "default" : "secondary"}
                            className="shadow-sm"
                          >
                            {!c.fecha_corte ? "Abierto" : "Cerrado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleVerDetalle(c.idcorte)}
                            className="hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-12"
                      >
                        <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No hay registros disponibles</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Paginación */}
        <div className="flex items-center justify-between mt-6">
          <Button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            variant="outline"
            className="shadow-sm"
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página <span className="font-semibold">{page}</span> de{" "}
            <span className="font-semibold">{totalPages}</span>
          </span>
          <Button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            variant="outline"
            className="shadow-sm"
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Dialog Cerrar Turno */}
      <Dialog open={dialogCerrarTurno} onOpenChange={setDialogCerrarTurno}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-600" />
              Cerrar Turno (X)
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cerrar el turno actual?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium mb-2">Información del turno:</p>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Folio:</span>{" "}
                  <span className="font-mono font-medium">
                    {currentX?.folio ?? "—"}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Total vendido:</span>{" "}
                  <span className="font-semibold text-green-600">
                    {formatMoney(Number(currentX?.total_vendido ?? 0))}
                  </span>
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm">
                <strong>Nota:</strong> Al cerrar este turno se abrirá
                automáticamente uno nuevo.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogCerrarTurno(false)}
              disabled={processingClose}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmCerrarTurno}
              disabled={processingClose}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {processingClose ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Cerrando...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Cerrar Turno
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Cerrar Día */}
      <Dialog open={dialogCerrarDia} onOpenChange={setDialogCerrarDia}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-purple-600" />
              Cerrar Día (Z)
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cerrar el día actual?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm font-medium mb-2">Información del día:</p>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Folio:</span>{" "}
                  <span className="font-mono font-medium">
                    {currentZ?.folio ?? "—"}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Total del día:</span>{" "}
                  <span className="font-semibold text-purple-600">
                    {formatMoney(Number(currentZ?.total_vendido ?? 0))}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Turnos:</span>{" "}
                  <span className="font-medium">{turnosDelDia.length}</span>
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm">
                <strong>Nota:</strong> Al cerrar el día se cerrará el turno
                actual y se iniciará un nuevo día con un nuevo turno.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogCerrarDia(false)}
              disabled={processingClose}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmCerrarDia}
              disabled={processingClose}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {processingClose ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Cerrando...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Cerrar Día
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CorteCaja;
