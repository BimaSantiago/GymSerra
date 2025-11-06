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

interface DetalleCompra {
  iddetalle_compra: number;
  idarticulo: number;
  articulo: string;
  cantidad: number;
  subtotal: number;
  costo: number;
  precio: number;
}

interface CompraInfo {
  idcompra: number;
  proveedor: string;
  fecha: string;
  total: number;
}

interface ApiResponse {
  success?: boolean;
  info?: CompraInfo;
  detalles?: DetalleCompra[];
  articulos?: Articulo[];
  total?: number;
  error?: string;
}

/* ---------- Componente principal ---------- */
const ComprasDetalle: React.FC = () => {
  const [searchParams] = useSearchParams();
  const idcompra = Number(searchParams.get("idcompra"));
  const navigate = useNavigate();

  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [detalles, setDetalles] = useState<DetalleCompra[]>([]);
  const [info, setInfo] = useState<CompraInfo | null>(null);
  const [form, setForm] = useState({
    idarticulo: "",
    cantidad: "",
    precioCosto: "",
    precioVenta: "",
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
  }, [idcompra]);

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
        `http://localhost/GymSerra/public/api/compras.php?action=detalle&idcompra=${idcompra}`
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
      idcompra,
      idarticulo: Number(form.idarticulo),
      cantidad: Number(form.cantidad),
      precioCosto: Number(form.precioCosto),
      precioVenta: Number(form.precioVenta),
      iddetalle_compra: editingId,
    };
    const action = editingId ? "updateDetalle" : "addDetalle";

    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/compras.php?action=${action}`,
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
        setForm({
          idarticulo: "",
          cantidad: "",
          precioCosto: "",
          precioVenta: "",
        });
        void fetchDetalles();
      } else {
        setAlert({ type: "error", message: data.error ?? "Error al guardar" });
      }
    } catch {
      setAlert({ type: "error", message: "Error de conexión con el servidor" });
    }
  };

  /* ---------- Editar ---------- */
  const handleEdit = (detalle: DetalleCompra): void => {
    setEditingId(detalle.iddetalle_compra);
    setForm({
      idarticulo: String(detalle.idarticulo),
      cantidad: String(detalle.cantidad),
      precioCosto: String(detalle.costo),
      precioVenta: String(detalle.precio),
    });
  };

  /* ---------- Eliminar ---------- */
  const handleDelete = async (id: number): Promise<void> => {
    if (!confirm("¿Eliminar este detalle?")) return;
    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/compras.php?action=deleteDetalle&iddetalle_compra=${id}`
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
        <h2 className="text-2xl font-bold">Detalles de Compra #{idcompra}</h2>
        <Button
          onClick={() => navigate("/dashboard/compras")}
          variant="outline"
        >
          Volver
        </Button>
      </div>

      {info && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4 shadow-sm">
          <p>
            <strong>Proveedor:</strong> {info.proveedor}
          </p>
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

        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label>Cantidad</Label>
            <Input
              type="number"
              value={form.cantidad}
              onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Precio Costo</Label>
            <Input
              type="number"
              step="0.01"
              value={form.precioCosto}
              onChange={(e) =>
                setForm({ ...form, precioCosto: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label>Precio Venta</Label>
            <Input
              type="number"
              step="0.01"
              value={form.precioVenta}
              onChange={(e) =>
                setForm({ ...form, precioVenta: e.target.value })
              }
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
            <TableHead>Costo</TableHead>
            <TableHead>Precio Venta</TableHead>
            <TableHead>Subtotal</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {detalles.length > 0 ? (
            detalles.map((d) => (
              <TableRow key={d.iddetalle_compra}>
                <TableCell>{d.articulo}</TableCell>
                <TableCell>{d.cantidad}</TableCell>
                <TableCell>${d.costo}</TableCell>
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
                    onClick={() => handleDelete(d.iddetalle_compra)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500 py-4">
                No hay artículos agregados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ComprasDetalle;
