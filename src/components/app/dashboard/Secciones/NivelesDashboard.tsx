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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Pencil } from "lucide-react";

interface Nivel {
  idnivel: number;
  nombre_nivel: string;
  iddeporte: number;
  deporte: string;
}

const NivelesDashboard = () => {
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [deportes, setDeportes] = useState<
    { iddeporte: string; nombre: string }[]
  >([]);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [form, setForm] = useState({
    idnivel: 0,
    nombre_nivel: "",
    iddeporte: "",
  });

  const fetchNiveles = async () => {
    try {
      const response = await fetch(
        "http://localhost/GymSerra/public/api/niveles.php?action=list"
      );
      const data = await response.json();
      if (data.success) {
        const filtrados = search
          ? data.niveles.filter(
              (n: Nivel) =>
                n.deporte.toLowerCase().includes(search.toLowerCase()) ||
                n.nombre_nivel.toLowerCase().includes(search.toLowerCase())
            )
          : data.niveles;
        setNiveles(filtrados);
      }
    } catch (error) {
      console.error("Error al obtener niveles:", error);
    }
  };

  const fetchDeportes = async () => {
    try {
      const response = await fetch(
        "http://localhost/GymSerra/public/api/deportes.php?action=list"
      );
      const data = await response.json();
      if (data.success) {
        setDeportes(data.deportes);
      }
    } catch (error) {
      console.error("Error al obtener deportes:", error);
    }
  };

  useEffect(() => {
    fetchNiveles();
    fetchDeportes();
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing
      ? "http://localhost/GymSerra/public/api/niveles.php?action=update"
      : "http://localhost/GymSerra/public/api/niveles.php?action=create";

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
            ? "Nivel actualizado correctamente"
            : "Nivel creado correctamente",
        });
        fetchNiveles();
        setIsDialogOpen(false);
        resetForm();
      } else {
        setAlert({ type: "error", message: data.error });
      }
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error("Error al guardar nivel:", error);
      setAlert({ type: "error", message: "Error en el servidor" });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleEdit = (nivel: Nivel) => {
    setForm({
      idnivel: nivel.idnivel,
      nombre_nivel: nivel.nombre_nivel,
      iddeporte: String(nivel.iddeporte),
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setForm({
      idnivel: 0,
      nombre_nivel: "",
      iddeporte: "",
    });
    setIsEditing(false);
  };

  return (
    <div className="p-4">
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
          <AlertTitle className="font-semibold text-gray-800">
            {alert.type === "success" ? "Éxito" : "Error"}
          </AlertTitle>
          <AlertDescription className="text-gray-600">
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between mb-6">
        <Input
          placeholder="Buscar nivel..."
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
              Agregar Nivel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Nivel" : "Nuevo Nivel"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-600 mb-1.5 block">
                  Nombre del Nivel
                </Label>
                <Input
                  value={form.nombre_nivel}
                  onChange={(e) =>
                    setForm({ ...form, nombre_nivel: e.target.value })
                  }
                  required
                  className="rounded-lg shadow-sm focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 mb-1.5 block">
                  Deporte Asociado
                </Label>
                <Select
                  value={form.iddeporte}
                  onValueChange={(v) => setForm({ ...form, iddeporte: v })}
                >
                  <SelectTrigger className="rounded-lg shadow-sm">
                    <SelectValue placeholder="Selecciona un deporte" />
                  </SelectTrigger>
                  <SelectContent>
                    {deportes.map((d) => (
                      <SelectItem key={d.iddeporte} value={d.iddeporte}>
                        {d.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      {/* 📋 Tabla de Niveles */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre del Nivel</TableHead>
            <TableHead>Deporte</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {niveles.length > 0 ? (
            niveles.map((nivel) => (
              <TableRow key={nivel.idnivel}>
                <TableCell>{nivel.idnivel}</TableCell>
                <TableCell>{nivel.nombre_nivel}</TableCell>
                <TableCell>{nivel.deporte}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(nivel)}
                    className="hover:bg-gray-100"
                  >
                    <Pencil className="h-4 w-4 text-gray-700" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-gray-500 py-6">
                No hay niveles registrados
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default NivelesDashboard;
