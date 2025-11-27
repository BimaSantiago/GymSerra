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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CheckCircle2, AlertCircle, Pencil, Trash2 } from "lucide-react";

/* ---------- Tipos ---------- */
interface Articulo {
  idarticulo: number;
  nombre: string;
}

interface DetalleVenta {
  iddetalle_venta: number;
  idarticulo: number;
  articulo: string;
  cantidad: number;
  subtotal: number;
  precio: number;
}

interface VentaInfo {
  idventa: number;
  fecha: string;
  total: number;
}

interface ApiResponse {
  success?: boolean;
  info?: VentaInfo;
  detalles?: DetalleVenta[];
  articulos?: Articulo[];
  total?: number;
  error?: string;
}

/* ---------- Componente principal ---------- */
const VentasDetalle: React.FC = () => {
  const [searchParams] = useSearchParams();
  const idventa = Number(searchParams.get("idventa"));
  const navigate = useNavigate();

  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [detalles, setDetalles] = useState<DetalleVenta[]>([]);
  const [info, setInfo] = useState<VentaInfo | null>(null);
  const [form, setForm] = useState({
    idarticulo: "",
    cantidad: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  /* ---------- Cargar datos ---------- */
  useEffect(() => {
    void fetchArticulos();
    void fetchDetalles();
  }, [idventa]);

  const fetchArticulos = async (): Promise<void> => {
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/articulos.php?action=list"
      );
      const data = await res.json();
      if (Array.isArray(data.articulos)) setArticulos(data.articulos);
    } catch {
      console.error("Error al cargar artículos");
    }
  };

  const fetchDetalles = async (): Promise<void> => {
    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/ventas.php?action=detalle&idventa=${idventa}`
      );
      const data: ApiResponse = await res.json();
      if (data.success) {
        setDetalles(data.detalles ?? []);
        setInfo(data.info ?? null);
      }
    } catch {
      console.error("Error al cargar detalles");
    }
  };

  /* ---------- Guardar (Agregar / Editar) ---------- */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    const body = {
      idventa,
      idarticulo: Number(form.idarticulo),
      cantidad: Number(form.cantidad),
      iddetalle_venta: editingId,
    };
    const action = editingId ? "updateDetalle" : "addDetalle";

    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/ventas.php?action=${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (data.success) {
        setAlert({
          type: "success",
          message: editingId ? "Detalle actualizado" : "Detalle agregado",
        });
        setEditingId(null);
        setForm({ idarticulo: "", cantidad: "" });
        void fetchDetalles();
      } else {
        setAlert({ type: "error", message: data.error ?? "Error al guardar" });
      }
    } catch {
      setAlert({ type: "error", message: "Error de conexión con el servidor" });
    }
  };

  /* ---------- Editar ---------- */
  const handleEdit = (detalle: DetalleVenta): void => {
    setEditingId(detalle.iddetalle_venta);
    setForm({
      idarticulo: String(detalle.idarticulo),
      cantidad: String(detalle.cantidad),
    });
  };

  /* ---------- Eliminar ---------- */
  const handleDelete = async (id: number): Promise<void> => {
    if (!confirm("¿Eliminar este detalle?")) return;
    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/ventas.php?action=deleteDetalle&iddetalle_venta=${id}`
      );
      const data = await res.json();
      if (data.success) {
        setAlert({ type: "success", message: "Detalle eliminado" });
        void fetchDetalles();
      } else {
        setAlert({ type: "error", message: data.error ?? "Error al eliminar" });
      }
    } catch {
      setAlert({ type: "error", message: "Error de conexión" });
    }
  };

  /* ---------- Render ---------- */
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">Detalles de Venta #{idventa}</h2>
        <Button onClick={() => navigate("/dashboard/ventas")} variant="outline">
          Volver
        </Button>
      </div>

      {info && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4 shadow-sm">
          <p>
            <strong>Fecha:</strong> {info.fecha}
          </p>
          <p>
            <strong>Total actual:</strong> ${info.total}
          </p>
        </div>
      )}

      {alert && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="mb-4 rounded-2xl shadow-lg bg-gray-50"
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

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-xl shadow-lg mb-6"
      >
        <div>
          <Label>Artículo</Label>
          <Select
            value={form.idarticulo}
            onValueChange={(v) => setForm({ ...form, idarticulo: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un artículo" />
            </SelectTrigger>
            <SelectContent>
              {articulos.map((a) => (
                <SelectItem key={a.idarticulo} value={String(a.idarticulo)}>
                  {a.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Cantidad</Label>
            <Input
              type="number"
              value={form.cantidad}
              onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
              required
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              className="w-full bg-gray-800 text-white hover:bg-gray-700"
            >
              {editingId ? "Actualizar" : "Agregar"}
            </Button>
          </div>
        </div>
      </form>

      {/* Tabla */}
      <Table className="border border-gray-200 rounded-lg">
        <TableHeader>
          <TableRow>
            <TableHead>Artículo</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Subtotal</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {detalles.length > 0 ? (
            detalles.map((d) => (
              <TableRow key={d.iddetalle_venta}>
                <TableCell>{d.articulo}</TableCell>
                <TableCell>{d.cantidad}</TableCell>
                <TableCell>${d.precio}</TableCell>
                <TableCell>${d.subtotal}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(d)}
                  >
                    <Pencil className="h-4 w-4 text-gray-700" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(d.iddetalle_venta)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                No hay artículos agregados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default VentasDetalle;
