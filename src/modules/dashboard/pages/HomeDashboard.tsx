import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  DollarSign,
  TrendingUp,
  Package,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_BASE = "http://localhost/GymSerra/public";

interface Estadistica {
  total_alumnos: number;
  alumnos_activos: number;
  alumnos_inactivos: number;
  total_mensualidades_mes: number;
  mensualidades_pagadas: number;
  mensualidades_pendientes: number;
  mensualidades_vencidas: number;
  total_ventas_mes: number;
  total_articulos: number;
  articulos_activos: number;
  proximos_eventos: number;
}

interface AlumnosPorDeporte {
  deporte: string;
  total: number;
  color: string;
}

interface VentasMensuales {
  mes: string;
  ventas: number;
  mensualidades: number;
}

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState<Estadistica>({
    total_alumnos: 0,
    alumnos_activos: 0,
    alumnos_inactivos: 0,
    total_mensualidades_mes: 0,
    mensualidades_pagadas: 0,
    mensualidades_pendientes: 0,
    mensualidades_vencidas: 0,
    total_ventas_mes: 0,
    total_articulos: 0,
    articulos_activos: 0,
    proximos_eventos: 0,
  });

  const [alumnosPorDeporte, setAlumnosPorDeporte] = useState<
    AlumnosPorDeporte[]
  >([]);
  const [ventasMensuales, setVentasMensuales] = useState<VentasMensuales[]>([]);

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  const fetchEstadisticas = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/estadisticas.php?action=all`
      );
      const data = await response.json();

      if (data.success) {
        setEstadisticas(data.estadisticas);
        setAlumnosPorDeporte(data.alumnos_por_deporte || []);
        setVentasMensuales(data.ventas_mensuales || []);
      } else {
        console.error("Error en la respuesta:", data.error);
        // Mantener datos de ejemplo en caso de error
        setEstadisticas({
          total_alumnos: 0,
          alumnos_activos: 0,
          alumnos_inactivos: 0,
          total_mensualidades_mes: 0,
          mensualidades_pagadas: 0,
          mensualidades_pendientes: 0,
          mensualidades_vencidas: 0,
          total_ventas_mes: 0,
          total_articulos: 0,
          articulos_activos: 0,
          proximos_eventos: 0,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const totalIngresos =
    estadisticas.total_mensualidades_mes + estadisticas.total_ventas_mes;
  const tasaActividad = (
    (estadisticas.alumnos_activos / estadisticas.total_alumnos) *
    100
  ).toFixed(1);
  const tasaPago = (
    (estadisticas.mensualidades_pagadas /
      (estadisticas.mensualidades_pagadas +
        estadisticas.mensualidades_pendientes +
        estadisticas.mensualidades_vencidas)) *
    100
  ).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-200">
            Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Bienvenido al sistema de gestión Gym Serra
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Último corte</p>
          <p className="text-lg font-semibold text-gray-200">
            {new Date().toLocaleDateString("es-MX", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Alertas importantes */}
      {estadisticas.mensualidades_vencidas > 0 && (
        <Alert
          variant="destructive"
          className="border-red-500/50 bg-red-500/10"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atención requerida</AlertTitle>
          <AlertDescription>
            Hay {estadisticas.mensualidades_vencidas} mensualidades vencidas que
            requieren seguimiento.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              Total Alumnos
            </CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {estadisticas.total_alumnos}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {estadisticas.alumnos_activos} activos ({tasaActividad}%)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              Ingresos del Mes
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {formatCurrency(totalIngresos)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Mensualidades + Ventas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              Mensualidades
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {estadisticas.mensualidades_pagadas}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {estadisticas.mensualidades_pendientes} pendientes,{" "}
              {estadisticas.mensualidades_vencidas} vencidas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              Inventario
            </CardTitle>
            <Package className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {estadisticas.articulos_activos}
            </div>
            <p className="text-xs text-gray-400 mt-1">Artículos activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con gráficas */}
      <Tabs defaultValue="ingresos" className="space-y-4">
        <TabsList className="bg-gray-800/50">
          <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
          <TabsTrigger value="alumnos">Alumnos</TabsTrigger>
          <TabsTrigger value="mensualidades">Mensualidades</TabsTrigger>
        </TabsList>

        <TabsContent value="ingresos" className="space-y-4">
          <Card className="border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-200">
                Ingresos Mensuales (Últimos 6 meses)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ventasMensuales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="mes" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar
                    dataKey="mensualidades"
                    fill="#3B82F6"
                    name="Mensualidades"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="ventas"
                    fill="#10B981"
                    name="Ventas"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200 text-base">
                  Desglose de Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Mensualidades</span>
                  <span className="text-sm font-semibold text-gray-200">
                    {formatCurrency(estadisticas.total_mensualidades_mes)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">
                    Ventas de artículos
                  </span>
                  <span className="text-sm font-semibold text-gray-200">
                    {formatCurrency(estadisticas.total_ventas_mes)}
                  </span>
                </div>
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-200">
                      Total
                    </span>
                    <span className="text-base font-bold text-green-400">
                      {formatCurrency(totalIngresos)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200 text-base">
                  Estado de Pagos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Pagadas</span>
                    <span className="text-green-400 font-semibold">
                      {estadisticas.mensualidades_pagadas}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${tasaPago}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Pendientes</span>
                    <span className="text-yellow-400 font-semibold">
                      {estadisticas.mensualidades_pendientes}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Vencidas</span>
                    <span className="text-red-400 font-semibold">
                      {estadisticas.mensualidades_vencidas}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alumnos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200">
                  Distribución por Deporte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={alumnosPorDeporte}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ deporte, total }) => `${deporte}: ${total}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
                    >
                      {alumnosPorDeporte.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200">
                  Estadísticas de Alumnos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {alumnosPorDeporte.map((deporte, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">
                        {deporte.deporte}
                      </span>
                      <span className="text-sm font-semibold text-gray-200">
                        {deporte.total} alumnos
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${
                            (deporte.total / estadisticas.total_alumnos) * 100
                          }%`,
                          backgroundColor: deporte.color,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mensualidades" className="space-y-4">
          <Card className="border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-200">
                Resumen de Mensualidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-center">
                    <div className="flex justify-center">
                      <CheckCircle2 className="h-8 w-8 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-100">
                      {estadisticas.mensualidades_pagadas}
                    </p>
                    <p className="text-sm text-gray-400">Pagadas</p>
                  </div>
                  <div className="space-y-2 text-center">
                    <div className="flex justify-center">
                      <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-100">
                      {estadisticas.mensualidades_vencidas}
                    </p>
                    <p className="text-sm text-gray-400">Vencidas</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Tasa de Cobro</span>
                    <span className="text-sm font-semibold text-gray-200">
                      {tasaPago}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${tasaPago}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-lg font-semibold text-gray-200">
                    Total recaudado este mes
                  </p>
                  <p className="text-3xl font-bold text-green-400 mt-2">
                    {formatCurrency(estadisticas.total_mensualidades_mes)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Próximos eventos */}
      <Card className="border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-200 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recordatorios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-200">
                  Próximos eventos programados
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Revisa el calendario de eventos
                </p>
              </div>
              <span className="text-lg font-bold text-blue-400">
                {estadisticas.proximos_eventos}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
