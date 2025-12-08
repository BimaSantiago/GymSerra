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

interface UnidadMedida {
  idunidad: number;
  clave: string;
  descripcion: string;
  tipo: string | null;
}

const API_BASE = "http://localhost/GymSerra/public";

const UnidadesMedidaDashboard: React.FC = () => {
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    idunidad: 0,
    clave: "",
    descripcion: "",
    tipo: "",
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const totalPages = Math.ceil(total / limit) || 1;

  // 🔹 Obtener unidades de medida con paginación
  const fetchUnidades = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/unidad_medida.php?action=list&page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`
      );
      const data = await response.json();

      if (data.success) {
        setUnidades(data.unidades || []);
        setTotal(data.total || 0);
      } else {
        setUnidades([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error al obtener unidades de medida:", error);
      setUnidades([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    fetchUnidades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const resetForm = () => {
    setForm({
      idunidad: 0,
      clave: "",
      descripcion: "",
      tipo: "",
    });
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = isEditing
      ? `${API_BASE}/api/unidad_medida.php?action=update`
      : `${API_BASE}/api/unidad_medida.php?action=create`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idunidad: form.idunidad,
        clave: form.clave,
        descripcion: form.descripcion,
        tipo: form.tipo || null,
      }),
    });

    const data = await response.json();

    if (data.success) {
      setAlert({
        type: "success",
        message: isEditing
          ? "Unidad de medida actualizada correctamente"
          : "Unidad de medida creada correctamente",
      });
      fetchUnidades();
      setIsDialogOpen(false);
      resetForm();
    } else {
      setAlert({
        type: "error",
        message: data.error || "Error al guardar unidad de medida",
      });
    }

    setTimeout(() => setAlert(null), 3000);
  };

  const handleEdit = (unidad: UnidadMedida) => {
    setForm({
      idunidad: unidad.idunidad,
      clave: unidad.clave,
      descripcion: unidad.descripcion,
      tipo: unidad.tipo ?? "",
    });
    setIsEditing(true);
    setIsDialogOpen(true);
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

      <div className="flex justify-between mb-6">
        <Input
          placeholder="Buscar por clave, descripción o tipo..."
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
              Agregar Unidad de Medida
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing
                  ? "Editar Unidad de Medida"
                  : "Nueva Unidad de Medida"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-600 mb-1.5 block">
                  Clave
                </Label>
                <Input
                  value={form.clave}
                  onChange={(e) =>
                    setForm({ ...form, clave: e.target.value.toUpperCase() })
                  }
                  required
                  maxLength={10}
                  className="rounded-lg shadow-sm focus:ring-1 focus:ring-gray-400 uppercase"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 mb-1.5 block">
                  Descripción
                </Label>
                <Input
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  required
                  className="rounded-lg shadow-sm focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 mb-1.5 block">
                  Tipo (opcional)
                </Label>
                <Input
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  placeholder="Ej: Longitud, Peso, Volumen..."
                  className="rounded-lg shadow-sm focus:ring-1 focus:ring-gray-400"
                />
              </div>

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
            <TableHead>Clave</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {unidades.map((u) => (
            <TableRow key={u.idunidad}>
              <TableCell>{u.idunidad}</TableCell>
              <TableCell>{u.clave}</TableCell>
              <TableCell>{u.descripcion}</TableCell>
              <TableCell>{u.tipo || "-"}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(u)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {unidades.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500 py-6">
                No hay unidades de medida registradas
              </TableCell>
            </TableRow>
          )}
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
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage(page + 1)}
          className="bg-gray-800 hover:bg-gray-600 text-white font-medium"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};

export default UnidadesMedidaDashboard;
