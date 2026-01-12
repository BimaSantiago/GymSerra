import React, { useEffect, useState } from "react";
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
import { AlertCircle, CheckCircle2, Pencil } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_BASE = "https://academiagymserra.garzas.store";

interface Cliente {
  idcliente: number;
  curp: string;
  nombre_completo: string;
  f_nacimiento: string; // ISO date
  estado: "Activo" | "Inactivo";
  fecha_registro: string | null; // datetime
  f_ultima_compra: string | null; // datetime
}

const ClientesDashboard: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    idcliente: 0,
    curp: "",
    nombre_completo: "",
    f_nacimiento: "",
    estado: "Activo" as "Activo" | "Inactivo",
  });

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // ===================== Fetch clientes =====================

  const fetchClientes = async () => {
    const resp = await fetch(
      `${API_BASE}/api/clientes.php?action=list&page=${page}&limit=${limit}&search=${encodeURIComponent(
        search
      )}`
    );
    const data = await resp.json();
    if (data.success) {
      setClientes(data.clientes || []);
      setTotal(data.total || 0);
    } else {
      setAlert({
        type: "error",
        message: data.error || "Error al cargar clientes",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [page, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const resetForm = () => {
    setForm({
      idcliente: 0,
      curp: "",
      nombre_completo: "",
      f_nacimiento: "",
      estado: "Activo",
    });
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.curp || !form.nombre_completo || !form.f_nacimiento) {
      setAlert({
        type: "error",
        message:
          "CURP, nombre completo y fecha de nacimiento son obligatorios.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    const url = isEditing
      ? `${API_BASE}/api/clientes.php?action=update`
      : `${API_BASE}/api/clientes.php?action=create`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await resp.json();

    if (data.success) {
      setAlert({
        type: "success",
        message: isEditing
          ? "Cliente actualizado correctamente"
          : "Cliente creado correctamente",
      });
      fetchClientes();
      setIsDialogOpen(false);
      resetForm();
    } else {
      setAlert({
        type: "error",
        message: data.error || "Error al guardar el cliente",
      });
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handleEdit = async (idcliente: number) => {
    const resp = await fetch(
      `${API_BASE}/api/clientes.php?action=get&idcliente=${idcliente}`
    );
    const data = await resp.json();
    if (data.success && data.cliente) {
      const c: Cliente = data.cliente;
      // f_nacimiento viene como "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss"
      const onlyDate =
        c.f_nacimiento && c.f_nacimiento.length >= 10
          ? c.f_nacimiento.substring(0, 10)
          : "";

      setForm({
        idcliente: c.idcliente,
        curp: c.curp,
        nombre_completo: c.nombre_completo,
        f_nacimiento: onlyDate,
        estado: c.estado,
      });
      setIsEditing(true);
      setIsDialogOpen(true);
    } else {
      setAlert({
        type: "error",
        message: data.error || "Cliente no encontrado",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const formatDateTime = (val: string | null) => {
    if (!val) return "-";
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return val;
    return d.toLocaleString();
  };

  const formatDate = (val: string | null) => {
    if (!val) return "-";
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return val;
    return d.toLocaleDateString();
  };

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

      {/* BUSCADOR + BOTÓN NUEVO */}
      <div className="flex justify-between mb-6">
        <Input
          placeholder="Buscar cliente por nombre o CURP..."
          value={search}
          onChange={handleSearchChange}
          className="max-w-sm rounded-lg shadow-md"
        />
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsEditing(false);
              }}
              className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg"
            >
              Agregar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>CURP</Label>
                <Input
                  value={form.curp}
                  onChange={(e) =>
                    setForm({ ...form, curp: e.target.value.toUpperCase() })
                  }
                  maxLength={50}
                  required
                />
              </div>

              <div>
                <Label>Nombre completo</Label>
                <Input
                  value={form.nombre_completo}
                  onChange={(e) =>
                    setForm({ ...form, nombre_completo: e.target.value })
                  }
                  maxLength={150}
                  required
                />
              </div>

              <div>
                <Label>Fecha de nacimiento</Label>
                <Input
                  type="date"
                  value={form.f_nacimiento}
                  onChange={(e) =>
                    setForm({ ...form, f_nacimiento: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Estado</Label>
                <Select
                  value={form.estado}
                  onValueChange={(value) =>
                    setForm({ ...form, estado: value as "Activo" | "Inactivo" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-gray-800 text-white hover:bg-gray-700"
                >
                  {isEditing ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* TABLA PRINCIPAL */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>CURP</TableHead>
            <TableHead>Nombre completo</TableHead>
            <TableHead>Fecha nacimiento</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha registro</TableHead>
            <TableHead>Última compra</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((c) => (
            <TableRow key={c.idcliente}>
              <TableCell>{c.idcliente}</TableCell>
              <TableCell>{c.curp}</TableCell>
              <TableCell>{c.nombre_completo}</TableCell>
              <TableCell>{formatDate(c.f_nacimiento)}</TableCell>
              <TableCell>{c.estado}</TableCell>
              <TableCell>{formatDateTime(c.fecha_registro)}</TableCell>
              <TableCell>{formatDateTime(c.f_ultima_compra)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(c.idcliente)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {clientes.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-gray-500 py-6">
                No hay clientes para mostrar.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* PAGINACIÓN */}
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

export default ClientesDashboard;
