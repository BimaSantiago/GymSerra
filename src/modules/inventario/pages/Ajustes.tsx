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
import { AlertCircle, CheckCircle2, Eye, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Ajuste {
  idajuste: number;
  fecha: string;
  comentario: string;
  // El backend ahora devuelve "Entrada"/"Salida", pero lo normalizamos a minúsculas
  tipo: "entrada" | "salida" | string;
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

  const [tab, setTab] = useState<"todos" | "entrada" | "salida">("todos");

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
        `https://academiagymserra.garzas.store/api/ajustes.php?${params.toString()}`
      );
      const data: ApiResponse = await response.json();

      if (data.success) {
        const normalizados =
          data.ajustes?.map((a) => ({
            ...a,
            tipo: (a.tipo || "").toLowerCase(),
          })) ?? [];
        setAjustes(normalizados);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const totalPages = Math.ceil(total / limit) || 1;

  const filtrarPorTab = (lista: Ajuste[]) => {
    if (tab === "todos") return lista;
    return lista.filter((a) => (a.tipo || "").toLowerCase() === tab);
  };

  const renderTabla = (lista: Ajuste[]) => (
    <Table className="rounded-lg shadow-sm">
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
        {lista.length > 0 ? (
          lista.map((a) => (
            <TableRow key={`${a.tipo}-${a.idajuste}`}>
              <TableCell>{a.idajuste}</TableCell>
              <TableCell>{a.fecha}</TableCell>
              <TableCell>
                <span
                  className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                    (a.tipo || "").toLowerCase() === "entrada"
                      ? "bg-green-600"
                      : "bg-red-600"
                  }`}
                >
                  {(a.tipo || "").toLowerCase() === "entrada"
                    ? "Entrada"
                    : "Salida"}
                </span>
              </TableCell>
              <TableCell>{a.comentario}</TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleVerDetalle(
                      ((a.tipo || "").toLowerCase() as "entrada" | "salida") ??
                        "entrada",
                      a.idajuste
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
            <TableCell colSpan={5} className="text-center text-gray-500 py-4">
              No se encontraron ajustes en este rango de fechas.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

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
        <h1 className="text-2xl font-bold text-primary/80">
          Ajustes de Inventario
        </h1>
        <Button
          onClick={handleNuevoAjuste}
          className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Nuevo Ajuste
        </Button>
      </div>

      {/* Filtro de fechas */}
      <div className="flex flex-wrap gap-4 mb-6 bg-accent p-4 rounded-xl shadow-sm">
        <div>
          <label className="block text-sm font-medium text-primary/80">
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
          <label className="block text-sm font-medium text-primary/80">
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

      {/* Tabs de tipo de ajuste */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "todos" | "entrada" | "salida")}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="entrada">Entradas</TabsTrigger>
          <TabsTrigger value="salida">Salidas</TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
          {renderTabla(filtrarPorTab(ajustes))}
        </TabsContent>
        <TabsContent value="entrada">
          {renderTabla(filtrarPorTab(ajustes))}
        </TabsContent>
        <TabsContent value="salida">
          {renderTabla(filtrarPorTab(ajustes))}
        </TabsContent>
      </Tabs>

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

export default Ajustes;
