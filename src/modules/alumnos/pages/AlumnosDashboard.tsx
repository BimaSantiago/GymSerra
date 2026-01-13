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
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Pencil } from "lucide-react";

interface Alumno {
  idalumno: number;
  curp: string;
  nombre_completo: string;
  f_nacimiento: string;
  estado: string;
  estado_documentos: string;
  fecha_pago: string;
  fecha_vencimiento: string;
}

const AlumnosDashboard = () => {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    idalumno: 0,
    curp: "",
    nombre_completo: "",
    f_nacimiento: "",
    idmensualidad: 1, // Default value, adjust as needed
    estado: "Activo",
    estado_documentos: "Completo",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchAlumnos = async () => {
    const response = await fetch(
      `https://academiagymserra.garzas.store/api/alumnos.php?action=list&page=${page}&limit=${limit}&search=${search}`
    );
    const data = await response.json();
    setAlumnos(data.alumnos);
    setTotal(data.total);
  };

  useEffect(() => {
    fetchAlumnos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing
      ? "https://academiagymserra.garzas.store/api/alumnos.php?action=update"
      : "https://academiagymserra.garzas.store/api/alumnos.php?action=create";
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
          ? "Alumno actualizado correctamente"
          : "Alumno creado correctamente",
      });
      fetchAlumnos();
      setIsDialogOpen(false);
      resetForm();
    } else {
      setAlert({ type: "error", message: data.error });
    }
    setTimeout(() => setAlert(null), 3000); // Hide alert after 3 seconds
  };

  const handleEdit = async (idalumno: number) => {
    const response = await fetch(
      `https://academiagymserra.garzas.store/api/alumnos.php?action=get&idalumno=${idalumno}`
    );
    const data = await response.json();
    if (data.success) {
      setForm(data.alumno);
      setIsEditing(true);
      setIsDialogOpen(true);
    } else {
      setAlert({ type: "error", message: data.error });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const resetForm = () => {
    setForm({
      idalumno: 0,
      curp: "",
      nombre_completo: "",
      f_nacimiento: "",
      idmensualidad: 1,
      estado: "Activo",
      estado_documentos: "Completo",
    });
    setIsEditing(false);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4">
      {alert && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="mb-4 rounded-2xl shadow-xl bg-gray-50" // Added to match SubSeccion
        >
          {alert.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle className="font-serif text-lg text-gray-800">
            {alert.type === "success" ? "Éxito" : "Error"}
          </AlertTitle>
          <AlertDescription className="text-lg font-sans text-gray-600">
            {alert.message}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex justify-between mb-6">
        {" "}
        {/* Increased mb-4 to mb-6 */}
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={handleSearch}
          className="max-w-sm rounded-lg shadow-md" // Added shadow for consistency
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => resetForm()}
              className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg"
            >
              Agregar Alumno
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Alumno" : "Nuevo Alumno"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-600 mb-1.5 block">
                  Nombre Completo
                </Label>
                <Input
                  value={form.nombre_completo}
                  onChange={(e) =>
                    setForm({ ...form, nombre_completo: e.target.value })
                  }
                  required
                  className="rounded-lg shadow-sm focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 mb-1.5 block">
                  CURP
                </Label>
                <Input
                  value={form.curp}
                  onChange={(e) => setForm({ ...form, curp: e.target.value })}
                  required
                  className="rounded-lg shadow-sm focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 mb-1.5 block">
                  Fecha de Nacimiento
                </Label>
                <Input
                  type="date"
                  value={form.f_nacimiento}
                  onChange={(e) =>
                    setForm({ ...form, f_nacimiento: e.target.value })
                  }
                  required
                  className="rounded-lg shadow-sm focus:ring-1 focus:ring-gray-400"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 mb-1.5 block">
                  Estado
                </Label>
                <Select
                  value={form.estado}
                  onValueChange={(value) => setForm({ ...form, estado: value })}
                >
                  <SelectTrigger className="rounded-lg shadow-sm">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 mb-1.5 block">
                  Estado de Documentos
                </Label>
                <Select
                  value={form.estado_documentos}
                  onValueChange={(value) =>
                    setForm({ ...form, estado_documentos: value })
                  }
                >
                  <SelectTrigger className="rounded-lg shadow-sm">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Completo">Completo</SelectItem>
                    <SelectItem value="Incompleto">Incompleto</SelectItem>
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
            <TableHead>Nombre</TableHead>
            <TableHead>CURP</TableHead>
            <TableHead>Nacimiento</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Documentos</TableHead>
            <TableHead>Fecha Pago</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alumnos.map((alumno) => (
            <TableRow key={alumno.idalumno}>
              <TableCell>{alumno.idalumno}</TableCell>
              <TableCell>{alumno.nombre_completo}</TableCell>
              <TableCell>{alumno.curp}</TableCell>
              <TableCell>{alumno.f_nacimiento}</TableCell>
              <TableCell>{alumno.estado}</TableCell>
              <TableCell>{alumno.estado_documentos}</TableCell>
              <TableCell>{alumno.fecha_pago}</TableCell>
              <TableCell>{alumno.fecha_vencimiento}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(alumno.idalumno)}
                >
                  <Pencil className="h-4 w-4" />
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
    </div>
  );
};

export default AlumnosDashboard;
