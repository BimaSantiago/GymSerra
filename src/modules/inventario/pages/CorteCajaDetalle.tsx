import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Clock3, ShoppingCart, RotateCcw, Ban } from "lucide-react";

const API_BASE = "http://localhost/GymSerra/public/api/corte_caja.php";

type CorteTipoUI = "X" | "Z";
type CorteInfo = {
  idcorte: number;
  folio: string;
  fecha_inicio: string;
  fecha_corte: string | null;
  total_vendido: number | null;
  tipo: CorteTipoUI; // Ya transformado por el backend
};

type Venta = {
  idmovimiento: number;
  fecha: string;
  total: number;
  tipo: string;
  comentario: string | null;
};

type Devolucion = {
  iddevolucion: number;
  idmovimiento: number;
  monto_devuelto: number;
  fecha_devolucion: string;
};

type Cancelacion = {
  idcancelacion: number;
  idmovimiento: number;
  descripcion: string | null;
  motivo: string;
  monto_cancelado?: number;
};

type TurnoTimeline = {
  idcorte: number;
  folio: string;
  fecha_inicio: string;
  fecha_corte: string | null;
  total_vendido: number;
};

type ApiDetalleResponse = {
  success?: boolean;
  info?: CorteInfo;
  ventas?: Venta[];
  devoluciones?: Devolucion[];
  cancelaciones?: Cancelacion[];
  turnos?: TurnoTimeline[];
  error?: string;
};

function money(n: number) {
  return `$${Number(n ?? 0).toFixed(2)}`;
}

const CorteCajaDetalle: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const idcorteParam = searchParams.get("idcorte");

  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [info, setInfo] = useState<CorteInfo | null>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [cancelaciones, setCancelaciones] = useState<Cancelacion[]>([]);
  const [turnosZ, setTurnosZ] = useState<TurnoTimeline[]>([]);

  // Tab activo
  const [activeTab, setActiveTab] = useState("ventas");

  useEffect(() => {
    if (!idcorteParam) {
      setLoading(false);
      return;
    }
    fetchDetalle(Number(idcorteParam));
  }, [idcorteParam]);

  const fetchDetalle = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}?action=detalle&idcorte=${id}`);
      const data: ApiDetalleResponse = await res.json();

      if (!data.success || !data.info) {
        setAlert({
          type: "error",
          message: data.error || "No se pudo cargar el detalle.",
        });
        setLoading(false);
        return;
      }

      setInfo(data.info);
      setVentas(data.ventas || []);
      setDevoluciones(data.devoluciones || []);
      setCancelaciones(data.cancelaciones || []);
      setTurnosZ(data.turnos || []);

      // Lógica automática de tabs
      if (data.info.tipo === "Z") {
        setActiveTab("turnos");
      } else {
        setActiveTab("ventas");
      }

      setLoading(false);
    } catch {
      setLoading(false);
      setAlert({ type: "error", message: "Error de conexión." });
    }
  };

  const isZ = info?.tipo === "Z";
  const isOpen = info && !info.fecha_corte;

  return (
    <div className="p-6 min-w-10/12 mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">
            Detalle de Corte #{info?.idcorte}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">
              {isZ ? "Corte Día (Z)" : "Corte Turno (X)"}
            </Badge>
            <Badge variant={isOpen ? "default" : "secondary"}>
              {isOpen ? "ABIERTO" : "CERRADO"}
            </Badge>
            <span className="text-muted-foreground ml-2 text-sm">
              {info?.folio}
            </span>
          </div>
        </div>
        <Button
          onClick={() => navigate("/dashboard/corteCaja")}
          variant="outline"
          className="flex gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : !info ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>No se encontró el corte.</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Total Recaudado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {money(Number(info.total_vendido))}
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Inicio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-medium">{info.fecha_inicio}</div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Cierre
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-medium">
                  {info.fecha_corte || "En curso..."}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Logic */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-4">
              {isZ ? (
                <TabsTrigger value="turnos" className="flex gap-2">
                  <Clock3 className="w-4 h-4" /> Turnos (X)
                </TabsTrigger>
              ) : (
                <>
                  <TabsTrigger value="ventas" className="flex gap-2">
                    <ShoppingCart className="w-4 h-4" /> Ventas
                  </TabsTrigger>
                  <TabsTrigger value="devoluciones" className="flex gap-2">
                    <RotateCcw className="w-4 h-4" /> Devoluciones
                  </TabsTrigger>
                  <TabsTrigger value="cancelaciones" className="flex gap-2">
                    <Ban className="w-4 h-4" /> Cancelaciones
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {isZ ? (
              <TabsContent value="turnos">
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle>Turnos del Día</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {turnosZ.length === 0 ? (
                      <p className="text-muted-foreground">
                        No hay turnos registrados en este corte Z.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Folio</TableHead>
                            <TableHead>Inicio</TableHead>
                            <TableHead>Cierre</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {turnosZ.map((t) => (
                            <TableRow key={t.idcorte}>
                              <TableCell className="font-mono">
                                {t.folio}
                              </TableCell>
                              <TableCell>{t.fecha_inicio}</TableCell>
                              <TableCell>
                                {t.fecha_corte || "Abierto"}
                              </TableCell>
                              <TableCell>{money(t.total_vendido)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    navigate(
                                      `/dashboard/corteCajaDetalle?idcorte=${t.idcorte}`
                                    )
                                  }
                                >
                                  Ver
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ) : (
              <>
                <TabsContent value="ventas">
                  <Card className="rounded-2xl">
                    <CardContent className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Movimiento</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ventas.map((v) => (
                            <TableRow key={v.idmovimiento}>
                              <TableCell>
                                #{v.idmovimiento}{" "}
                                {v.comentario && `- ${v.comentario}`}
                              </TableCell>
                              <TableCell>{v.fecha}</TableCell>
                              <TableCell className="text-right font-medium">
                                {money(Number(v.total))}
                              </TableCell>
                            </TableRow>
                          ))}
                          {ventas.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="text-center py-4"
                              >
                                Sin ventas.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="devoluciones">
                  <Card className="rounded-2xl">
                    <CardContent className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {devoluciones.map((d) => (
                            <TableRow key={d.iddevolucion}>
                              <TableCell>#{d.iddevolucion}</TableCell>
                              <TableCell>{d.fecha_devolucion}</TableCell>
                              <TableCell className="text-right text-red-500 font-medium">
                                -{money(Number(d.monto_devuelto))}
                              </TableCell>
                            </TableRow>
                          ))}
                          {devoluciones.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="text-center py-4"
                              >
                                Sin devoluciones.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="cancelaciones">
                  <Card className="rounded-2xl">
                    <CardContent className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Motivo</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cancelaciones.map((c) => (
                            <TableRow key={c.idcancelacion}>
                              <TableCell>{c.motivo}</TableCell>
                              <TableCell>{c.descripcion || "-"}</TableCell>
                              <TableCell className="text-right text-orange-500 font-medium">
                                {money(Number(c.monto_cancelado))}
                              </TableCell>
                            </TableRow>
                          ))}
                          {cancelaciones.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="text-center py-4"
                              >
                                Sin cancelaciones.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
};

export default CorteCajaDetalle;
