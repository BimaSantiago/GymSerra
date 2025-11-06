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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Pencil, Eye } from "lucide-react";

interface Proveedor {
  idprovedor: number;
  nombre: string;
  RFC: string;
  dirección: string;
  teléfono: string;
  correo: string;
  estado: string;
}

interface Compra {
  idcompra: number;
  fecha: string;
  total: number;
}

interface DetalleCompra {
  iddetalle_compra: number;
  articulo: string;
  cantidad: number;
  subtotal: number;
  idcosto: number;
  idprecio: number;
}

const ProveedoresDashboard = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [detalles, setDetalles] = useState<DetalleCompra[]>([]);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(
    null
  );
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    idprovedor: 0,
    nombre: "",
    RFC: "",
    dirección: "",
    teléfono: "",
    correo: "",
    estado: "Activo",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPurchasesOpen, setIsPurchasesOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchProveedores = async () => {
    const response = await fetch(
      `http://localhost/GymSerra/public/api/proveedores.php?action=list&page=${page}&limit=${limit}&search=${search}`
    );
    const data = await response.json();
    setProveedores(data.proveedores);
    setTotal(data.total);
  };

  useEffect(() => {
    fetchProveedores();
  }, [page, search]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing
      ? "http://localhost/GymSerra/public/api/proveedores.php?action=update"
      : "http://localhost/GymSerra/public/api/proveedores.php?action=create";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (data.success) {
      setAlert({
        type: "success",
        message: isEditing
          ? "Proveedor actualizado correctamente"
          : "Proveedor creado correctamente",
      });
      fetchProveedores();
      setIsDialogOpen(false);
      resetForm();
    } else {
      setAlert({ type: "error", message: data.error });
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handleEdit = async (idprovedor: number) => {
    const response = await fetch(
      `http://localhost/GymSerra/public/api/proveedores.php?action=get&idprovedor=${idprovedor}`
    );
    const data = await response.json();
    if (data.success) {
      setForm(data.proveedor);
      setIsEditing(true);
      setIsDialogOpen(true);
    } else {
      setAlert({ type: "error", message: data.error });
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handleViewCompras = async (prov: Proveedor) => {
    setSelectedProveedor(prov);
    const response = await fetch(
      `http://localhost/GymSerra/public/api/proveedores.php?action=purchases&idprovedor=${prov.idprovedor}`
    );
    const data = await response.json();
    if (data.success) {
      setCompras(data.compras);
      setIsPurchasesOpen(true);
    } else {
      setCompras([]);
      setAlert({ type: "error", message: "No se pudieron cargar las compras" });
    }
  };

  const handleViewDetalleCompra = async (compra: Compra) => {
    setSelectedCompra(compra);
    const response = await fetch(
      `http://localhost/GymSerra/public/api/proveedores.php?action=purchase_detail&idcompra=${compra.idcompra}`
    );
    const data = await response.json();
    if (data.success) {
      setDetalles(data.detalles);
      setIsDetailsOpen(true);
    } else {
      setDetalles([]);
      setAlert({ type: "error", message: "No se pudo cargar el detalle" });
    }
  };

  const resetForm = () => {
    setForm({
      idprovedor: 0,
      nombre: "",
      RFC: "",
      dirección: "",
      teléfono: "",
      correo: "",
      estado: "Activo",
    });
    setIsEditing(false);
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

      <div className="flex justify-between mb-6">
        <Input
          placeholder="Buscar proveedor..."
          value={search}
          onChange={handleSearch}
          className="max-w-sm rounded-lg shadow-md"
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => resetForm()}
              className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg"
            >
              Agregar Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Proveedor" : "Nuevo Proveedor"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
              <Label>RFC</Label>
              <Input
                value={form.RFC}
                onChange={(e) => setForm({ ...form, RFC: e.target.value })}
                required
              />
              <Label>Dirección</Label>
              <Input
                value={form.dirección}
                onChange={(e) =>
                  setForm({ ...form, dirección: e.target.value })
                }
                required
              />
              <Label>Teléfono</Label>
              <Input
                value={form.teléfono}
                onChange={(e) => setForm({ ...form, teléfono: e.target.value })}
                required
              />
              <Label>Correo</Label>
              <Input
                type="email"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                required
              />
              <Label>Estado</Label>
              <select
                id="estado"
                value={form.estado}
                aria-label="Estado"
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className="border rounded-md p-2 w-full"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
              <Button
                type="submit"
                className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg w-full"
              >
                {isEditing ? "Actualizar" : "Crear"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>RFC</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proveedores.map((prov) => (
            <TableRow key={prov.idprovedor}>
              <TableCell>{prov.idprovedor}</TableCell>
              <TableCell>{prov.nombre}</TableCell>
              <TableCell>{prov.RFC}</TableCell>
              <TableCell>{prov.teléfono}</TableCell>
              <TableCell>{prov.correo}</TableCell>
              <TableCell>{prov.estado}</TableCell>
              <TableCell className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(prov.idprovedor)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleViewCompras(prov)}
                >
                  <Eye className="h-4 w-4 text-blue-700" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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

      {/* Dialog de Compras */}
      <Dialog open={isPurchasesOpen} onOpenChange={setIsPurchasesOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compras de {selectedProveedor?.nombre}</DialogTitle>
          </DialogHeader>
          {compras.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Compra</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compras.map((c) => (
                  <TableRow
                    key={c.idcompra}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleViewDetalleCompra(c)}
                  >
                    <TableCell>{c.idcompra}</TableCell>
                    <TableCell>
                      {new Date(c.fecha).toLocaleDateString()}
                    </TableCell>
                    <TableCell>${c.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-600 text-center py-4">
              No se encontraron compras registradas.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Subdialog de Detalle de Compra */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalle de Compra #{selectedCompra?.idcompra}
            </DialogTitle>
          </DialogHeader>
          {detalles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artículo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>ID Costo</TableHead>
                  <TableHead>ID Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalles.map((d) => (
                  <TableRow key={d.iddetalle_compra}>
                    <TableCell>{d.articulo}</TableCell>
                    <TableCell>{d.cantidad}</TableCell>
                    <TableCell>${d.subtotal.toFixed(2)}</TableCell>
                    <TableCell>{d.idcosto}</TableCell>
                    <TableCell>{d.idprecio}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-600 text-center py-4">
              No hay detalles disponibles para esta compra.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProveedoresDashboard;
