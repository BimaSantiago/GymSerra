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
import { AlertCircle, CheckCircle2, Eye, PlusCircle } from "lucide-react";

interface Compra {
  idcompra: number;
  proveedor: string;
  fecha: string;
  total: number;
}

interface ApiResponse {
  success?: boolean;
  compras?: Compra[];
  total?: number;
  error?: string;
}

const Compras: React.FC = () => {
  const navigate = useNavigate();

  const [compras, setCompras] = useState<Compra[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const totalPages = Math.ceil(total / limit) || 1;

  const fetchCompras = async (): Promise<void> => {
    try {
      const params = new URLSearchParams({
        action: "list",
        page: String(page),
        limit: String(limit),
        search,
      });

      const res = await fetch(
        `https://academiagymserra.garzas.store/api/compras.php?${params.toString()}`
      );
      const data: ApiResponse = await res.json();

      if (data.success) {
        setCompras(data.compras ?? []);
        setTotal(data.total ?? 0);
      } else {
        setAlert({
          type: "error",
          message: data.error || "Error al cargar compras.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Error de conexión con el servidor.",
      });
    }

    setTimeout(() => setAlert(null), 3000);
  };

  useEffect(() => {
    void fetchCompras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const handleNuevaCompra = () => {
    // NO crea nada en BD, solo navega al detalle "nuevo"
    navigate("/dashboard/comprasDetalle");
  };

  const handleVerDetalle = (idcompra: number) => {
    navigate(`/dashboard/comprasDetalle?idcompra=${idcompra}`);
  };

  return (
    <div className="p-6">
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

      {/* Encabezado */}
      <div className="flex justify-between mb-6">
        <Input
          placeholder="Proveedor, fecha..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="w-64"
        />
        <Button
          onClick={handleNuevaCompra}
          className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Nueva Compra
        </Button>
      </div>

      {/* Tabla de compras */}
      <Table className="rounded-lg shadow-sm bg-card">
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {compras.length > 0 ? (
            compras.map((c) => (
              <TableRow key={c.idcompra}>
                <TableCell>{c.idcompra}</TableCell>
                <TableCell>{c.proveedor}</TableCell>
                <TableCell>{c.fecha}</TableCell>
                <TableCell>${c.total}</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleVerDetalle(c.idcompra)}
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                No se encontraron compras.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Paginación */}
      <div className="flex justify-between mt-4">
        <Button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="bg-gray-800 hover:bg-gray-600 text-white font-medium"
        >
          Anterior
        </Button>
        <span>
          Página {page} de {totalPages}
        </span>
        <Button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="bg-gray-800 hover:bg-gray-600 text-white font-medium"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};

export default Compras;
