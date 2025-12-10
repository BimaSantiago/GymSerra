import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  ShoppingCart,
  Ban,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Venta {
  idventa: number;
  fecha: string;
  total: number;
  // Puede venir del backend como "Activa" / "Cancelada"
  estado?: "Activa" | "Cancelada" | string;
  // O puede venir como flag numérico / booleano
  cancelada?: boolean | 0 | 1 | "0" | "1";
}

interface ApiResponse {
  success?: boolean;
  ventas?: Venta[];
  total?: number;
  error?: string;
}

const Ventas: React.FC = () => {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    void fetchVentas();
  }, [page, search]);

  const fetchVentas = async (): Promise<void> => {
    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/ventas.php?action=list&page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`
      );
      const data: ApiResponse = await res.json();
      if (data.success) {
        setVentas(data.ventas ?? []);
        setTotal(data.total ?? 0);
      } else if (data.error) {
        setAlert({ type: "error", message: data.error });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Error al conectar con el servidor.",
      });
    }
  };

  const handleNuevaVenta = (): void => {
    // Solo navega, la creación del movimiento se hace en VentasDetalle
    navigate("/dashboard/ventasDetalle");
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Helper robusto: decide si una venta está cancelada
  const esCancelada = (v: Venta): boolean => {
    if (v.estado === "Cancelada") return true;
    if (v.cancelada === true) return true;
    if (v.cancelada === 1) return true;
    if (v.cancelada === "1") return true;
    return false;
  };

  const ventasCanceladas = ventas.filter((v) => esCancelada(v));
  const ventasActivas = ventas.filter((v) => !esCancelada(v));

  return (
    <div className="p-4">
      {alert && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="mb-4 rounded-2xl shadow-xl bg-gray-50"
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

      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <Input
          placeholder="Buscar por fecha o ID..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm rounded-lg shadow-md"
        />
        <Button
          onClick={handleNuevaVenta}
          className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg flex items-center gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          Nueva Venta
        </Button>
      </div>

      {/* Tabs: Ventas / Ventas canceladas */}
      <Tabs defaultValue="activas" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="activas" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Ventas
          </TabsTrigger>
          <TabsTrigger value="canceladas" className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            Ventas canceladas
          </TabsTrigger>
        </TabsList>

        {/* VENTAS ACTIVAS */}
        <TabsContent value="activas">
          <Table className="border border-gray-200 rounded-lg shadow-sm">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventasActivas.length > 0 ? (
                ventasActivas.map((v) => (
                  <TableRow key={v.idventa}>
                    <TableCell>{v.idventa}</TableCell>
                    <TableCell>{v.fecha}</TableCell>
                    <TableCell>${v.total.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          navigate(
                            `/dashboard/ventasDetalle?idventa=${v.idventa}`
                          )
                        }
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-600 py-4"
                  >
                    No se encontraron ventas activas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* VENTAS CANCELADAS */}
        <TabsContent value="canceladas">
          <Table className="border border-gray-200 rounded-lg shadow-sm">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventasCanceladas.length > 0 ? (
                ventasCanceladas.map((v) => (
                  <TableRow key={v.idventa}>
                    <TableCell>{v.idventa}</TableCell>
                    <TableCell>{v.fecha}</TableCell>
                    <TableCell>${v.total.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          navigate(
                            `/dashboard/ventasDetalle?idventa=${v.idventa}`
                          )
                        }
                      >
                        <Eye className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-600 py-4"
                  >
                    No hay ventas canceladas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Paginación */}
      <div className="flex justify-between mt-4">
        <Button
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="bg-gray-800 hover:bg-gray-600 text-white font-medium"
        >
          Anterior
        </Button>
        <span>
          Página {page} de {totalPages}
        </span>
        <Button
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="bg-gray-800 hover:bg-gray-600 text-white font-medium"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};

export default Ventas;
