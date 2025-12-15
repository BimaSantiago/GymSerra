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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Lock,
  CalendarDays,
  Clock3,
} from "lucide-react";

// Recharts
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
type CorteTipoDB = "X" | "Y";

interface CorteCajaItem {
  idcorte: number;
  folio: string;
  fecha_inicio: string;
  fecha_corte: string | null;
  total_vendido: number | null;
  tipo?: CorteTipoDB;
  corte_principal?: number | null;
}

interface ApiListResponse {
  success?: boolean;
  cortes?: CorteCajaItem[];
  total?: number;
  error?: string;
}

interface ApiCurrentResponse {
  success?: boolean;
  corte?: CorteCajaItem | null;
  error?: string;
}

interface ApiCloseResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

interface Venta {
  idmovimiento: number;
  fecha: string;
  total: number;
}

interface ApiDetalleResponse {
  success?: boolean;
  info?: CorteCajaItem;
  ventas?: Venta[];
  error?: string;
}

const API_BASE = "http://localhost/GymSerra/public/api/corte_caja.php";

function formatMoney(n: number): string {
  return `$${Number(n ?? 0).toFixed(2)}`;
}

function formatDateTime(s?: string | null): string {
  if (!s) return "—";
  return s;
}

const ChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: any;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border bg-background p-2 shadow">
      <div className="text-xs text-muted-foreground mb-1">{String(label)}</div>
      <div className="space-y-1">
        {payload.map((item, idx) => {
          const c = item?.fill || item?.stroke || item?.color || "#8884d8";
          return (
            <div key={idx} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: c }}
              />
              <span className="text-sm">
                {item?.name ?? "Total"}: {formatMoney(Number(item?.value ?? 0))}
              </span>
            </div>
          );
        })}
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
  const [totalX, setTotalX] = useState(0);
  const [totalZ, setTotalZ] = useState(0);
  const [ventasX, setVentasX] = useState<Venta[]>([]);

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    window.setTimeout(() => setAlert(null), 3500);
  };

  const fetchCurrent = async () => {
    try {
      // 1. Obtener Corte X Actual
      const resX = await fetch(`${API_BASE}?action=getCurrent&tipo=X`);
      const dx: ApiCurrentResponse = await resX.json();
      if (dx.success) setCurrentX(dx.corte ?? null);

      // 2. Obtener Corte Z Actual
      const resZ = await fetch(`${API_BASE}?action=getCurrent&tipo=Z`);
      const dz: ApiCurrentResponse = await resZ.json();
      if (dz.success) setCurrentZ(dz.corte ?? null);
    } catch {
      showAlert("error", "Error de conexión obteniendo cortes actuales.");
    }
  };

  const fetchList = async (tipo: CorteTipoUI) => {
    const page = tipo === "X" ? pageX : pageZ;

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
      const data: ApiListResponse = await res.json();

      if (!data.success) {
        return;
      }

      if (tipo === "X") {
        setCortesX(data.cortes ?? []);
        setTotalX(data.total ?? 0);
      } else {
        setCortesZ(data.cortes ?? []);
        setTotalZ(data.total ?? 0);
      }
    } catch {
      showAlert("error", "Error cargando historial.");
    }
  };

  // Traer ventas para graficar el turno actual
  const fetchVentasDeCorteXActual = async (idcorte?: number | null) => {
    if (!idcorte) {
      setVentasX([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}?action=detalle&idcorte=${idcorte}`);
      const data: ApiDetalleResponse = await res.json();
      if (data.success) {
        setVentasX(
          (data.ventas ?? []).map((v) => ({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchList("X");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageX]);

  useEffect(() => {
    fetchList("Z");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageZ]);

  useEffect(() => {
    fetchList(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    fetchVentasDeCorteXActual(currentX?.idcorte);
  }, [currentX?.idcorte]);

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
    // IMPORTANTE: Ahora pasamos idcorte siempre, sin importar si es X o Z
    navigate(`/dashboard/corteCajaDetalle?idcorte=${idcorte}`);
  };

  const handleCerrarTurno = async () => {
    if (!currentX?.idcorte || currentX.fecha_corte) return;

    if (!window.confirm("¿Cerrar el turno actual (X)? Se abrirá uno nuevo."))
      return;

    try {
      const res = await fetch(`${API_BASE}?action=closeShift`, {
        method: "POST",
      });
      const data: ApiCloseResponse = await res.json();
      if (data.success) {
        showAlert("success", "Turno cerrado.");
        await fetchCurrent();
        await fetchList("X");
        await fetchList("Z"); // Z actualiza su total al cerrar X
      } else {
        showAlert("error", data.error || "No se pudo cerrar turno.");
      }
    } catch {
      showAlert("error", "Error de conexión.");
    }
  };

  const handleCerrarDia = async () => {
    if (!currentZ?.idcorte || currentZ.fecha_corte) return;

    if (
      !window.confirm(
        "¿Cerrar el día (Z)? Se cerrará el turno actual y comenzará un nuevo día."
      )
    )
      return;

    try {
      const res = await fetch(`${API_BASE}?action=closeDay`, {
        method: "POST",
      });
      const data: ApiCloseResponse = await res.json();
      if (data.success) {
        showAlert("success", "Día cerrado.");
        await fetchCurrent();
        await fetchList("X");
        await fetchList("Z");
      } else {
        showAlert("error", data.error || "No se pudo cerrar el día.");
      }
    } catch {
      showAlert("error", "Error de conexión.");
    }
  };

  const ventasPorHora = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of ventasX) {
      const hora = String(v.fecha ?? "").slice(11, 13) || "00";
      map[hora] = (map[hora] ?? 0) + Number(v.total ?? 0);
    }
    const horas = Object.keys(map).sort((a, b) => Number(a) - Number(b));
    return horas.map((h) => ({ hora: `${h}:00`, total: Number(map[h] ?? 0) }));
  }, [ventasX]);

  const cortes = tab === "X" ? cortesX : cortesZ;
  const total = tab === "X" ? totalX : totalZ;
  const page = tab === "X" ? pageX : pageZ;
  const setPage = tab === "X" ? setPageX : setPageZ;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-4">
      {alert && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="mb-4 rounded-2xl shadow-xl"
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

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-200">Cortes de Caja</h2>
          <p className="text-sm text-muted-foreground">
            Gestión de Turnos (X) y Cierres de Día (Z).
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleCerrarTurno}
            disabled={!currentX?.idcorte || !!currentX?.fecha_corte}
            className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg flex items-center gap-2"
          >
            <Lock className="h-4 w-4" /> Cerrar Turno (X)
          </Button>
          <Button
            onClick={handleCerrarDia}
            disabled={!currentZ?.idcorte || !!currentZ?.fecha_corte}
            className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg flex items-center gap-2"
          >
            <Lock className="h-4 w-4" /> Cerrar Día (Z)
          </Button>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as CorteTipoUI)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-full max-w-xl mb-4">
          <TabsTrigger value="X" className="flex items-center gap-2">
            <Clock3 className="h-4 w-4" /> Turnos (X)
          </TabsTrigger>
          <TabsTrigger value="Z" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Cierres Día (Z)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="X">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex justify-between">
                  Turno Actual
                  <Badge
                    variant={currentX?.fecha_corte ? "secondary" : "default"}
                  >
                    {currentX?.fecha_corte ? "CERRADO" : "ABIERTO"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  Folio:{" "}
                  <span className="font-mono">{currentX?.folio ?? "-"}</span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {formatMoney(Number(currentX?.total_vendido ?? 0))}
                </div>
                {currentX?.idcorte && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleVerDetalle(currentX!.idcorte)}
                  >
                    <Eye className="h-4 w-4 mr-2" /> Ver Detalle
                  </Button>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-2xl lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Ventas por Hora (Turno Actual)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ventasPorHora}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hora" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="total" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="Z">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex justify-between">
                  Día Actual
                  <Badge
                    variant={currentZ?.fecha_corte ? "secondary" : "default"}
                  >
                    {currentZ?.fecha_corte ? "CERRADO" : "ABIERTO"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  Folio:{" "}
                  <span className="font-mono">{currentZ?.folio ?? "-"}</span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {formatMoney(Number(currentZ?.total_vendido ?? 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Suma de todos los turnos (X) del día.
                </p>
                {currentZ?.idcorte && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleVerDetalle(currentZ!.idcorte)}
                  >
                    <Eye className="h-4 w-4 mr-2" /> Ver Detalle
                  </Button>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-2xl lg:col-span-2 border-dashed flex items-center justify-center bg-accent/20">
              <div className="text-center p-6 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>El Corte Z agrupa los cortes X generados durante el día.</p>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6 bg-accent p-4 rounded-xl shadow-sm">
        <Input
          type="date"
          value={dateStart}
          onChange={(e) => setDateStart(e.target.value)}
          className="w-48"
        />
        <Input
          type="date"
          value={dateEnd}
          onChange={(e) => setDateEnd(e.target.value)}
          className="w-48"
        />
        <Button onClick={handleFiltrar}>Filtrar</Button>
        <Button variant="outline" onClick={handleLimpiar}>
          Limpiar
        </Button>
      </div>

      <Table className="rounded-lg shadow-sm">
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Folio</TableHead>
            <TableHead>Inicio</TableHead>
            <TableHead>Cierre</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cortes.length > 0 ? (
            cortes.map((c) => (
              <TableRow key={c.idcorte}>
                <TableCell>{c.idcorte}</TableCell>
                <TableCell>{c.folio}</TableCell>
                <TableCell>{formatDateTime(c.fecha_inicio)}</TableCell>
                <TableCell>{formatDateTime(c.fecha_corte)}</TableCell>
                <TableCell>
                  {formatMoney(Number(c.total_vendido ?? 0))}
                </TableCell>
                <TableCell>
                  <Badge variant={!c.fecha_corte ? "outline" : "secondary"}>
                    {!c.fecha_corte ? "Abierto" : "Cerrado"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleVerDetalle(c.idcorte)}
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground py-6"
              >
                No hay datos.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex justify-between mt-4">
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Anterior
        </Button>
        <span>
          Página {page} de {totalPages}
        </span>
        <Button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};

export default CorteCaja;
