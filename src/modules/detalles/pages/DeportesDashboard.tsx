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
import { Textarea } from "@/components/ui/textarea";

interface Deporte {
  iddeporte: number;
  nombre: string;
  descripcion: string;
  color: string;
}

const API_BASE = "http://localhost/GymSerra/public";

const DeportesDashboard: React.FC = () => {
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [form, setForm] = useState({
    iddeporte: 0,
    nombre: "",
    descripcion: "",
    color: "#000000", // valor por defecto
  });

  const fetchDeportes = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/deportes.php?action=list`);
      const data = await response.json();

      if (data.success) {
        const lista: Deporte[] = data.deportes || [];

        const filtrados = search
          ? lista.filter(
              (d) =>
                d.nombre.toLowerCase().includes(search.toLowerCase()) ||
                (d.descripcion || "")
                  .toLowerCase()
                  .includes(search.toLowerCase())
            )
          : lista;

        setDeportes(filtrados);
      } else {
        setDeportes([]);
      }
    } catch (error) {
      console.error("Error al obtener deportes:", error);
    }
  };

  useEffect(() => {
    fetchDeportes();
  }, [search]);

  const resetForm = () => {
    setForm({
      iddeporte: 0,
      nombre: "",
      descripcion: "",
      color: "#000000",
    });
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = isEditing
      ? `${API_BASE}/api/deportes.php?action=update`
      : `${API_BASE}/api/deportes.php?action=create`;

    try {
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
            ? "Deporte actualizado correctamente"
            : "Deporte creado correctamente",
        });
        fetchDeportes();
        setIsDialogOpen(false);
        resetForm();
      } else {
        setAlert({
          type: "error",
          message: data.error || "Error al guardar deporte",
        });
      }

      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error("Error al guardar deporte:", error);
      setAlert({
        type: "error",
        message: "Error en el servidor",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleEdit = (deporte: Deporte) => {
    setForm({
      iddeporte: deporte.iddeporte,
      nombre: deporte.nombre,
      descripcion: deporte.descripcion,
      color: deporte.color || "#000000",
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  return (
    <div className="p-4">
      {alert && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="mb-4 rounded-2xl shadow-lg"
        >
          {alert.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle className="font-semibold">
            {alert.type === "success" ? "Éxito" : "Error"}
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between mb-6">
        <Input
          placeholder="Buscar deporte..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm rounded-lg shadow-md"
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => resetForm()}
              className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg"
            >
              Agregar Deporte
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Deporte" : "Nuevo Deporte"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-600 mb-1.5 block">
                  Nombre del deporte
                </Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  className="rounded-lg shadow-sm focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 mb-1.5 block">
                  Descripción
                </Label>
                <Textarea
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
                  Color
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color || "#000000"}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                    placeholder="Color"
                    className="h-10 w-14 rounded-md border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{form.color}</span>
                </div>
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
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deportes.length > 0 ? (
            deportes.map((deporte) => (
              <TableRow key={deporte.iddeporte}>
                <TableCell>{deporte.iddeporte}</TableCell>
                <TableCell>{deporte.nombre}</TableCell>
                <TableCell>{deporte.descripcion}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <span
                      className="inline-block h-4 w-4 rounded-full border it"
                      style={{ backgroundColor: deporte.color }}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(deporte)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500 py-6">
                No hay deportes registrados
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DeportesDashboard;
