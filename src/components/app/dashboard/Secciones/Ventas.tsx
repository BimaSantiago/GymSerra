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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, AlertCircle, Eye } from "lucide-react";

interface Venta {
  idventa: number;
  fecha: string;
  total: number;
}

interface ApiResponse {
  success?: boolean;
  ventas?: Venta[];
  idventa?: number;
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    void fetchVentas();
  }, [page, search]);

  const fetchVentas = async (): Promise<void> => {
    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/ventas.php?action=list&page=${page}&limit=${limit}&search=${search}`
      );
      const data: ApiResponse = await res.json();
      if (data.success) {
        setVentas(data.ventas ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      console.error("Error cargando ventas");
    }
  };

  const handleNuevaVenta = async (): Promise<void> => {
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/ventas.php?action=create",
        {
          method: "POST",
        }
      );
      const data: ApiResponse = await res.json();
      if (data.success && data.idventa) {
        navigate(`/dashboard/ventasDetalle?idventa=${data.idventa}`);
      } else {
        setAlert({
          type: "error",
          message: data.error ?? "Error al crear venta",
        });
      }
    } catch {
      setAlert({ type: "error", message: "Error al conectar con el servidor" });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

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
          placeholder="Buscar por fecha..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm rounded-lg shadow-md"
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setIsDialogOpen(true);
                void handleNuevaVenta();
              }}
              className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg"
            >
              Nueva Venta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Creando Venta...</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de ventas */}
      <Table className="border border-gray-200 rounded-lg shadow-sm">
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ventas.length > 0 ? (
            ventas.map((v) => (
              <TableRow key={v.idventa}>
                <TableCell>{v.idventa}</TableCell>
                <TableCell>{v.fecha}</TableCell>
                <TableCell>${v.total}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      navigate(`/dashboard/ventasDetalle?idventa=${v.idventa}`)
                    }
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-gray-600 py-4">
                No se encontraron ventas
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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
