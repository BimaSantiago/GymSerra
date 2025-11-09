import React, { useState, useEffect } from "react";
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
import { useNavigate } from "react-router-dom";

interface Ajuste {
  idajuste: number;
  fecha: string;
  comentario: string;
  tipo: "entrada" | "salida";
}

interface ApiResponse {
  success?: boolean;
  ajustes?: Ajuste[];
  total?: number;
  error?: string;
}

const Ajustes = () => {
  const [ajustes, setAjustes] = useState<Ajuste[]>([]);
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

  // Obtener ajustes con paginación y rango de fechas
  const fetchAjustes = async () => {
    try {
      const params = new URLSearchParams({
        action: "list",
        page: String(page),
        limit: String(limit),
      });
      if (dateStart) params.append("dateStart", dateStart);
      if (dateEnd) params.append("dateEnd", dateEnd);

      const response = await fetch(
        `http://localhost/GymSerra/public/api/ajustes.php?${params.toString()}`
      );
      const data: ApiResponse = await response.json();

      if (data.success) {
        setAjustes(data.ajustes ?? []);
        setTotal(data.total ?? 0);
      } else {
        setAlert({
          type: "error",
          message: data.error || "Error al cargar ajustes.",
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
    fetchAjustes();
  }, [page]);

  const handleFiltrar = () => {
    setPage(1);
    fetchAjustes();
  };

  const handleNuevoAjuste = () => {
    navigate("/dashboard/ajustesDetalle");
  };

  const handleVerDetalle = (tipo: "entrada" | "salida", idajuste: number) => {
    navigate(`/dashboard/ajustesDetalle?tipo=${tipo}&idajuste=${idajuste}`);
  };

  const totalPages = Math.ceil(total / limit);

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

      {/* 🔹 Encabezado principal */}
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Ajustes de Inventario
        </h2>
        <Button
          onClick={handleNuevoAjuste}
          className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Nuevo Ajuste
        </Button>
      </div>

      {/* 🔹 Filtro de fechas */}
      <div className="flex flex-wrap gap-4 mb-6 bg-gray-50 p-4 rounded-xl shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700">
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
          <label className="block text-sm font-medium text-gray-700">
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
          <Button
            variant="outline"
            onClick={() => {
              setDateStart("");
              setDateEnd("");
              setPage(1);
              fetchAjustes();
            }}
          >
            Limpiar
          </Button>
        </div>
      </div>

      {/* 🔹 Tabla de ajustes */}
      <Table className="border border-gray-200 rounded-lg shadow-sm">
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Comentario</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ajustes.length > 0 ? (
            ajustes.map((a) => (
              <TableRow key={`${a.tipo}-${a.idajuste}`}>
                <TableCell>{a.idajuste}</TableCell>
                <TableCell>{a.fecha}</TableCell>
                <TableCell>
                  <span
                    className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                      a.tipo === "entrada" ? "bg-green-600" : "bg-red-600"
                    }`}
                  >
                    {a.tipo === "entrada" ? "Entrada" : "Salida"}
                  </span>
                </TableCell>
                <TableCell>{a.comentario}</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleVerDetalle(a.tipo, a.idajuste)}
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                No se encontraron ajustes en este rango de fechas.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* 🔹 Paginación */}
      <div className="flex justify-between mt-4">
        <Button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="bg-gray-800 hover:bg-gray-600 text-white font-medium"
        >
          Anterior
        </Button>
        <span>
          Página {page} de {totalPages || 1}
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

export default Ajustes;
