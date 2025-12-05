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

interface Deporte {
  iddeporte: number;
  nombre: string;
}

const API_BASE = "http://localhost/GymSerra/public";

const NivelesDashboard: React.FC = () => {
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [deportes, setDeportes] = useState<Deporte[]>([]);

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    idnivel: 0,
    nombre_nivel: "",
    iddeporte: "",
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const totalPages = Math.ceil(total / limit);

  // 🔹 Obtener niveles con paginación (igual que AlumnosDashboard)
  const fetchNiveles = async () => {
    const response = await fetch(
      `${API_BASE}/api/niveles.php?action=list&page=${page}&limit=${limit}&search=${encodeURIComponent(
        search
      )}`
    );
    const data = await response.json();

    if (data.success) {
      setNiveles(data.niveles || []);
      setTotal(data.total || 0);
    } else {
      setNiveles([]);
      setTotal(0);
    }
  };

  // 🔹 Obtener deportes para el select
  const fetchDeportes = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/deportes.php?action=list`);
      const data = await response.json();
      if (data.success) {
        setDeportes(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.deportes || []).map((d: any) => ({
            iddeporte: Number(d.iddeporte),
            nombre: d.nombre,
          }))
        );
      }
    } catch (error) {
      console.error("Error al obtener deportes:", error);
    }
  };

  useEffect(() => {
    fetchNiveles();
    fetchDeportes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const resetForm = () => {
    setForm({
      idnivel: 0,
      nombre_nivel: "",
      iddeporte: "",
    });
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = isEditing
      ? `${API_BASE}/api/niveles.php?action=update`
      : `${API_BASE}/api/niveles.php?action=create`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idnivel: form.idnivel,
        nombre_nivel: form.nombre_nivel,
        iddeporte: Number(form.iddeporte),
      }),
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
      setAlert({
        type: "error",
        message: data.error || "Error al guardar nivel",
      });
    }

    setTimeout(() => setAlert(null), 3000);
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
          placeholder="Buscar por nombre de nivel o deporte..."
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
                  Deporte
                </Label>
                <Select
                  value={form.iddeporte}
                  onValueChange={(value) =>
                    setForm({ ...form, iddeporte: value })
                  }
                >
                  <SelectTrigger className="rounded-lg shadow-sm">
                    <SelectValue placeholder="Selecciona un deporte" />
                  </SelectTrigger>
                  <SelectContent>
                    {deportes.map((d) => (
                      <SelectItem key={d.iddeporte} value={String(d.iddeporte)}>
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
          {niveles.map((nivel) => (
            <TableRow key={nivel.idnivel}>
              <TableCell>{nivel.idnivel}</TableCell>
              <TableCell>{nivel.nombre_nivel}</TableCell>
              <TableCell>{nivel.deporte}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(nivel)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {niveles.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-gray-500 py-6">
                No hay niveles registrados
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
          Página {page} de {totalPages || 1}
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

export default NivelesDashboard;
