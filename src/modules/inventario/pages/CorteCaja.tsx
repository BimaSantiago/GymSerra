import { useState, useEffect } from "react";
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
import { AlertCircle, CheckCircle2, Eye, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CorteCajaItem {
  idcorte: number;
  folio: string;
  fecha_inicio: string;
  fecha_corte: string | null;
  total_vendido: number | null;
}

interface ApiListResponse {
  success?: boolean;
  cortes?: CorteCajaItem[];
  total?: number;
  error?: string;
}

interface ApiCloseResponse {
  success?: boolean;
  message?: string;
  corteActual?: CorteCajaItem | null;
  nuevoCorte?: CorteCajaItem | null;
  error?: string;
}

const CorteCaja = () => {
  const [cortes, setCortes] = useState<CorteCajaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const navigate = useNavigate();

  const fetchCortes = async () => {
    try {
      const params = new URLSearchParams({
        action: "list",
        page: String(page),
        limit: String(limit),
      });
      if (dateStart) params.append("dateStart", dateStart);
      if (dateEnd) params.append("dateEnd", dateEnd);

      const response = await fetch(
        `http://localhost/GymSerra/public/api/corte_caja.php?${params.toString()}`
      );
      const data: ApiListResponse = await response.json();

      if (data.success) {
        setCortes(data.cortes ?? []);
        setTotal(data.total ?? 0);
      } else {
        setAlert({
          type: "error",
          message: data.error || "Error al cargar cortes de caja.",
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
    fetchCortes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFiltrar = () => {
    setPage(1);
    fetchCortes();
  };

  const handleLimpiar = () => {
    setDateStart("");
    setDateEnd("");
    setPage(1);
    fetchCortes();
  };

  const handleCerrarCorteActual = async () => {
    try {
      const response = await fetch(
        "http://localhost/GymSerra/public/api/corte_caja.php?action=closeCurrent",
        {
          method: "POST",
        }
      );
      const data: ApiCloseResponse = await response.json();

      if (data.success) {
        setAlert({
          type: "success",
          message:
            data.message ||
            "Corte de caja cerrado correctamente y se creó un nuevo corte.",
        });
        fetchCortes();
      } else {
        setAlert({
          type: "error",
          message: data.error || "Error al cerrar el corte de caja.",
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

  const handleVerDetalle = (idcorte: number) => {
    // Redirige a un detalle similar a AjustesDetalle.tsx, pero para corte de caja
    navigate(`/dashboard/corteCajaDetalle?idcorte=${idcorte}`);
  };

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

      {/* Encabezado principal */}
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-200">Cortes de Caja</h2>
        <Button
          onClick={handleCerrarCorteActual}
          className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg flex items-center gap-2"
        >
          <Lock className="h-4 w-4" />
          Cerrar corte de caja actual
        </Button>
      </div>

      {/* Filtro de fechas */}
      <div className="flex flex-wrap gap-4 mb-6 bg-accent p-4 rounded-xl shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-100">
            Desde
          </label>
          <Input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="w-48"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-100">
            Hasta
          </label>
          <Input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="w-48"
          />
        </div>
        <div className="flex gap-2 mt-5">
          <Button
            onClick={handleFiltrar}
            className="bg-gray-800 text-white hover:bg-gray-700"
          >
            Filtrar
          </Button>
          <Button variant="outline" onClick={handleLimpiar}>
            Limpiar
          </Button>
        </div>
      </div>

      {/* Tabla de cortes */}
      <Table className="rounded-lg shadow-sm">
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Folio</TableHead>
            <TableHead>Fecha inicio</TableHead>
            <TableHead>Fecha corte</TableHead>
            <TableHead>Total vendido</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cortes.length > 0 ? (
            cortes.map((c) => {
              const isOpen = !c.fecha_corte;
              return (
                <TableRow key={c.idcorte}>
                  <TableCell>{c.idcorte}</TableCell>
                  <TableCell>{c.folio}</TableCell>
                  <TableCell>{c.fecha_inicio}</TableCell>
                  <TableCell>{c.fecha_corte ?? "—"}</TableCell>
                  <TableCell>
                    ${Number(c.total_vendido ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                        isOpen ? "bg-green-600" : "bg-gray-600"
                      }`}
                    >
                      {isOpen ? "Abierto" : "Cerrado"}
                    </span>
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
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500 py-4">
                No se encontraron cortes de caja en este rango de fechas.
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

export default CorteCaja;
