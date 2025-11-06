import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, AlertCircle, Eye, Pencil } from "lucide-react";

/* ---------- Tipos ---------- */
interface Proveedor {
  idprovedor: number;
  nombre: string;
}

interface Articulo {
  idarticulo: number;
  nombre: string;
}

interface Compra {
  idcompra: number;
  proveedor: string;
  fecha: string;
  total: number;
}

interface CompraForm {
  idprovedor: string;
  idarticulo: string;
  precioVenta: string;
  precioCosto: string;
}

interface ApiResponse {
  success?: boolean;
  idcompra?: number;
  error?: string;
  proveedores?: Proveedor[];
  articulos?: Articulo[];
  compras?: Compra[];
  total?: number;
  data?: unknown;
}

/* ---------- Utilidad ---------- */
function extractArray<T>(data: ApiResponse, key: keyof ApiResponse): T[] {
  const value = data[key];
  if (Array.isArray(value)) return value as T[];
  if (Array.isArray(data.data)) return data.data as T[];
  return [];
}

/* ---------- Componente principal ---------- */
const Compras: React.FC = () => {
  const navigate = useNavigate();

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [form, setForm] = useState<CompraForm>({
    idprovedor: "",
    idarticulo: "",
    precioVenta: "",
    precioCosto: "",
  });

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCompraId, setCurrentCompraId] = useState<number | null>(null);

  /* ---------- Carga inicial ---------- */
  useEffect(() => {
    void fetchProveedores();
  }, []);

  useEffect(() => {
    void fetchCompras();
  }, [page, search]);

  /* ---------- Fetchers ---------- */
  const fetchProveedores = async (): Promise<void> => {
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/proveedores.php?action=list"
      );
      const data: ApiResponse = await res.json();
      setProveedores(extractArray<Proveedor>(data, "proveedores"));
    } catch {
      console.error("Error cargando proveedores");
    }
  };

  const fetchCompras = async (): Promise<void> => {
    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/compras.php?action=list&page=${page}&limit=${limit}&search=${search}`
      );
      const data: ApiResponse = await res.json();
      if (data.success) {
        setCompras(extractArray<Compra>(data, "compras"));
        setTotal(data.total ?? 0);
      }
    } catch {
      console.error("Error cargando compras");
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    const body = {
      idprovedor: Number(form.idprovedor) || 0,
      idcompra: currentCompraId,
    };
    const action = isEditing ? "update" : "create";

    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/compras.php?action=${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data: ApiResponse = await res.json();

      if (data.success) {
        if (!isEditing && data.idcompra) {
          // Redirige al detalle si es nueva compra
          navigate(`/dashboard/comprasDetalle?idcompra=${data.idcompra}`);
        }
        setAlert({
          type: "success",
          message: isEditing
            ? "Proveedor actualizado correctamente"
            : "Compra creada correctamente",
        });
        setIsDialogOpen(false);
        setTimeout(() => setAlert(null), 2000);
        void fetchCompras();
      } else {
        setAlert({
          type: "error",
          message: data.error ?? "Error al guardar compra",
        });
      }
    } catch {
      setAlert({ type: "error", message: "Error al conectar con el servidor" });
    }
  };

  /* ---------- Editar compra (abrir modal con datos) ---------- */
  const handleEdit = async (id: number): Promise<void> => {
    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/compras.php?action=get&idcompra=${id}`
      );
      const data: ApiResponse = await res.json();
      if (data.success && data.data && typeof data.data === "object") {
        const compra = data.data as {
          idprovedor: number;
          idarticulo: number;
          precioVenta: number;
          precioCosto: number;
        };
        setForm({
          idprovedor: String(compra.idprovedor),
          idarticulo: String(compra.idarticulo),
          precioVenta: String(compra.precioVenta),
          precioCosto: String(compra.precioCosto),
        });
        setCurrentCompraId(id);
        setIsEditing(true);
        setIsDialogOpen(true);
      }
    } catch {
      setAlert({
        type: "error",
        message: "Error al obtener datos de la compra",
      });
    }
  };

  /* ---------- Helpers ---------- */
  const resetForm = (): void => {
    setForm({
      idprovedor: "",
      idarticulo: "",
      precioVenta: "",
      precioCosto: "",
    });
    setIsEditing(false);
    setCurrentCompraId(null);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  /* ---------- Render ---------- */
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
          placeholder="Buscar por proveedor o fecha..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm rounded-lg shadow-md"
        />

        {/* Botón + Modal */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg"
            >
              Nueva Compra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing
                  ? "Editar Proveedor de la Compra"
                  : "Registrar Nueva Compra"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div>
                <Label>Proveedor</Label>
                <Select
                  value={form.idprovedor}
                  onValueChange={(v) => setForm({ ...form, idprovedor: v })}
                >
                  <SelectTrigger className="rounded-lg shadow-sm">
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedores.map((p) => (
                      <SelectItem
                        key={p.idprovedor}
                        value={String(p.idprovedor)}
                      >
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="bg-gray-800 text-white hover:bg-gray-700 w-full rounded-lg"
              >
                {isEditing ? "Actualizar Proveedor" : "Crear Compra"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de compras */}
      <Table className="border border-gray-200 rounded-lg shadow-sm">
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Acciones</TableHead>
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
                <TableCell className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      navigate(
                        `/dashboard/comprasDetalle?idcompra=${c.idcompra}`
                      )
                    }
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(c.idcompra)}
                  >
                    <Pencil className="h-4 w-4 text-gray-700" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-600 py-4">
                No se encontraron compras
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Paginación */}
      <div className="flex justify-between mt-4">
        <Button
          disabled={page === 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          className="bg-gray-800 hover:bg-gray-600 text-white font-medium"
        >
          Anterior
        </Button>
        <span>
          Página {page} de {totalPages}
        </span>
        <Button
          disabled={page === totalPages}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          className="bg-gray-800 hover:bg-gray-600 text-white font-medium"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};

export default Compras;
