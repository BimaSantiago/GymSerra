import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShoppingCart,
  RotateCcw,
  Ban,
} from "lucide-react";

/* ======================= TIPOS / INTERFACES ======================= */

interface CorteInfo {
  idcorte: number;
  folio: string;
  fecha_inicio: string;
  fecha_corte: string | null;
  total_vendido: number | null;
}

interface Venta {
  idmovimiento: number;
  fecha: string;
  total: number;
  tipo: string;
  comentario: string | null;
  idcliente: number | null;
  iduser: number | null;
}

interface Devolucion {
  iddevolucion: number;
  idmovimiento: number;
  monto_devuelto: number;
  fecha_devolucion: string;
}

interface Cancelacion {
  idcancelacion: number;
  idmovimiento: number;
  descripcion: string | null;
  motivo: string;
  /** Monto que afecta al corte (normalmente total de la venta cancelada) */
  monto_cancelado?: number;
}

interface ApiDetalleResponse {
  success?: boolean;
  info?: CorteInfo;
  ventas?: Venta[];
  devoluciones?: Devolucion[];
  cancelaciones?: Cancelacion[];
  error?: string;
}

/* ======================= COMPONENTE PRINCIPAL ======================= */

const CorteCajaDetalle: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [info, setInfo] = useState<CorteInfo | null>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [cancelaciones, setCancelaciones] = useState<Cancelacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const idcorteParam = searchParams.get("idcorte");
  const idcorte = idcorteParam ? Number(idcorteParam) : NaN;

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchDetalleCorte = async (): Promise<void> => {
    if (!idcorte || Number.isNaN(idcorte)) {
      setLoading(false);
      showAlert("error", "ID de corte de caja no válido.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/corte_caja.php?action=detalle&idcorte=${idcorte}`
      );
      const data: ApiDetalleResponse = await res.json();

      if (!data.success || !data.info) {
        showAlert(
          "error",
          data.error || "No se pudo obtener el detalle del corte de caja."
        );
        setLoading(false);
        return;
      }

      setInfo(data.info);
      setVentas(data.ventas ?? []);
      setDevoluciones(data.devoluciones ?? []);
      setCancelaciones(data.cancelaciones ?? []);
      setLoading(false);
    } catch {
      setLoading(false);
      showAlert("error", "Error de conexión con el servidor.");
    }
  };

  useEffect(() => {
    void fetchDetalleCorte();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isCorteAbierto = info && !info.fecha_corte;

  /* ======================= TOTALES / DERIVADOS ======================= */

  const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total ?? 0), 0);

  const totalDevoluciones = devoluciones.reduce(
    (sum, d) => sum + Number(d.monto_devuelto ?? 0),
    0
  );

  const totalCancelaciones = cancelaciones.reduce(
    (sum, c) => sum + Number(c.monto_cancelado ?? 0),
    0
  );

  // Si el corte está abierto, el total actual se calcula en base a:
  // ventas - devoluciones - cancelaciones
  const totalActualCorte = isCorteAbierto
    ? totalVentas - totalDevoluciones - totalCancelaciones
    : Number(info?.total_vendido ?? 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">
            Detalle del corte de caja #{info?.idcorte ?? idcorteParam}
          </h2>
        </div>
        <Button
          onClick={() => navigate("/dashboard/corteCaja")}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      </div>

      {/* Alertas */}
      {alert && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="mb-4 rounded-2xl shadow-lg"
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

      {loading && (
        <div className="mb-6 bg-card rounded-lg p-4 shadow-sm">
          Cargando detalle del corte de caja...
        </div>
      )}

      {!loading && !info && (
        <div className="mb-6 bg-card rounded-lg p-4 shadow-sm">
          No se encontró información para este corte de caja.
        </div>
      )}

      {/* INFO PRINCIPAL DEL CORTE */}
      {info && (
        <div className="mb-6 bg-card rounded-lg p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Folio</Label>
              <Input value={info.folio} readOnly className="mt-1" />
            </div>
            <div>
              <Label>Fecha inicio</Label>
              <Input value={info.fecha_inicio} readOnly className="mt-1" />
            </div>
            <div>
              <Label>Fecha cierre</Label>
              <Input
                value={info.fecha_corte ?? "Corte aún abierto"}
                readOnly
                className="mt-1"
              />
            </div>
            <div>
              <Label>
                {isCorteAbierto ? "Total actual del corte" : "Total del corte"}
              </Label>
              <Input
                value={`$ ${totalActualCorte.toFixed(2)}`}
                readOnly
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                isCorteAbierto ? "bg-green-600" : "bg-gray-600"
              }`}
            >
              {isCorteAbierto ? "Corte abierto" : "Corte cerrado"}
            </span>

            <div className="text-sm text-gray-400 space-x-4">
              <span>
                Total ventas ligadas: <strong>${totalVentas.toFixed(2)}</strong>
              </span>
              <span>
                Total devoluciones ligadas:{" "}
                <strong>${totalDevoluciones.toFixed(2)}</strong>
              </span>
              <span>
                Total cancelaciones ligadas:{" "}
                <strong>${totalCancelaciones.toFixed(2)}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================== TABS ======================== */}
      {info && (
        <Tabs defaultValue="ventas" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="ventas" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Ventas
            </TabsTrigger>
            <TabsTrigger
              value="devoluciones"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Devoluciones
            </TabsTrigger>
            <TabsTrigger
              value="cancelaciones"
              className="flex items-center gap-2"
            >
              <Ban className="w-4 h-4" />
              Cancelaciones
            </TabsTrigger>
          </TabsList>

          {/* TAB VENTAS */}
          <TabsContent value="ventas">
            <div className="mb-8 bg-card rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">Ventas del corte</h3>
                <span className="text-sm text-gray-400">
                  {ventas.length} venta(s) • Total:{" "}
                  <strong>${totalVentas.toFixed(2)}</strong>
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID mov.</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventas.length > 0 ? (
                    ventas.map((v) => (
                      <TableRow key={v.idmovimiento}>
                        <TableCell>{v.idmovimiento}</TableCell>
                        <TableCell>{v.fecha}</TableCell>
                        <TableCell>{v.idcliente ?? "—"}</TableCell>

                        <TableCell className="text-right">
                          ${Number(v.total ?? 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-gray-500 py-4"
                      >
                        No hay ventas vinculadas a este corte.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* TAB DEVOLUCIONES */}
          <TabsContent value="devoluciones">
            <div className="mb-8 bg-card rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">
                  Devoluciones asociadas al corte
                </h3>
                <span className="text-sm text-gray-400">
                  {devoluciones.length} devolución(es) • Total devuelto:{" "}
                  <strong>${totalDevoluciones.toFixed(2)}</strong>
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID devolución</TableHead>
                    <TableHead>ID movimiento</TableHead>
                    <TableHead>Fecha devolución</TableHead>
                    <TableHead className="text-right">Monto devuelto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devoluciones.length > 0 ? (
                    devoluciones.map((d) => (
                      <TableRow key={d.iddevolucion}>
                        <TableCell>{d.iddevolucion}</TableCell>
                        <TableCell>{d.idmovimiento}</TableCell>
                        <TableCell>{d.fecha_devolucion}</TableCell>
                        <TableCell className="text-right">
                          ${Number(d.monto_devuelto ?? 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-gray-500 py-4"
                      >
                        No hay devoluciones asociadas a este corte.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* TAB CANCELACIONES */}
          <TabsContent value="cancelaciones">
            <div className="mb-8 bg-card rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">
                  Cancelaciones asociadas al corte
                </h3>
                <span className="text-sm text-gray-400">
                  {cancelaciones.length} cancelación(es) • Total cancelado:{" "}
                  <strong>${totalCancelaciones.toFixed(2)}</strong>
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID movimiento</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cancelaciones.length > 0 ? (
                    cancelaciones.map((c) => (
                      <TableRow key={c.idcancelacion}>
                        <TableCell>{c.idmovimiento}</TableCell>
                        <TableCell>{c.motivo}</TableCell>
                        <TableCell>{c.descripcion || "—"}</TableCell>
                        <TableCell className="text-right">
                          ${Number(c.monto_cancelado ?? 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-gray-500 py-4"
                      >
                        No hay cancelaciones asociadas a este corte.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default CorteCajaDetalle;
