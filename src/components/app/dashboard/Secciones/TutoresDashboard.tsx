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

interface Tutor {
  idtutor: number;
  idalumno: number;
  nombre_completo: string;
  curp: string;
  telefono: string;
  correo: string;
  estado_documentos: string;
  alumno_nombre: string;
  alumno_curp: string;
}

interface Alumno {
  idalumno: number;
  nombre_completo: string;
  curp: string;
}

const TutoresDashboard = () => {
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    idtutor: 0,
    idalumno: 0,
    nombre_completo: "",
    curp: "",
    telefono: "",
    correo: "",
    estado_documentos: "Incompleto",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchTutores = async () => {
    const response = await fetch(
      `http://localhost/GymSerra/public/api/tutores.php?action=list&page=${page}&limit=${limit}&search=${search}`
    );
    const data = await response.json();
    setTutores(data.tutores);
    setTotal(data.total);
  };

  const fetchAlumnos = async () => {
    const response = await fetch(
      `http://localhost/GymSerra/public/api/alumnos.php?action=list&page=1&limit=1000`
    );
    const data = await response.json();
    setAlumnos(data.alumnos);
  };

  useEffect(() => {
    fetchTutores();
    fetchAlumnos();
  }, [page, search]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing
      ? "http://localhost/GymSerra/public/api/tutores.php?action=update"
      : "http://localhost/GymSerra/public/api/tutores.php?action=create";
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
          ? "Tutor actualizado correctamente"
          : "Tutor creado correctamente",
      });
      fetchTutores();
      setIsDialogOpen(false);
      resetForm();
    } else {
      setAlert({ type: "error", message: data.error });
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handleEdit = async (idtutor: number) => {
    const response = await fetch(
      `http://localhost/GymSerra/public/api/tutores.php?action=get&idtutor=${idtutor}`
    );
    const data = await response.json();
    if (data.success) {
      setForm(data.tutor);
      setIsEditing(true);
      setIsDialogOpen(true);
    } else {
      setAlert({ type: "error", message: data.error });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const resetForm = () => {
    setForm({
      idtutor: 0,
      idalumno: 0,
      nombre_completo: "",
      curp: "",
      telefono: "",
      correo: "",
      estado_documentos: "Incompleto",
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
          <AlertTitle className="font-serif text-lg text-gray-800">
            {alert.type === "success" ? "Éxito" : "Error"}
          </AlertTitle>
          <AlertDescription className="text-lg font-sans text-gray-600">
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between mb-6">
        <Input
          placeholder="Buscar por nombre..."
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
              Agregar Tutor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Tutor" : "Nuevo Tutor"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-600 mb-1.5 block">
                  Alumno
                </Label>
                <Select
                  value={form.idalumno.toString()}
                  onValueChange={(value) =>
                    setForm({ ...form, idalumno: Number(value) })
                  }
                >
                  <SelectTrigger className="rounded-lg shadow-sm">
                    <SelectValue placeholder="Seleccionar alumno" />
                  </SelectTrigger>
                  <SelectContent>
                    {alumnos.map((a) => (
                      <SelectItem
                        key={a.idalumno}
                        value={a.idalumno.toString()}
                      >
                        {a.nombre_completo} ({a.curp})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Nombre del Tutor</Label>
                <Input
                  value={form.nombre_completo}
                  onChange={(e) =>
                    setForm({ ...form, nombre_completo: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>CURP del Tutor</Label>
                <Input
                  value={form.curp}
                  onChange={(e) => setForm({ ...form, curp: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Teléfono</Label>
                <Input
                  value={form.telefono}
                  onChange={(e) =>
                    setForm({ ...form, telefono: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Correo</Label>
                <Input
                  type="email"
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Estado de Documentos</Label>
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
            <TableHead>Tutor</TableHead>
            <TableHead>CURP Tutor</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Alumno</TableHead>
            <TableHead>CURP Alumno</TableHead>
            <TableHead>Documentos</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tutores.map((tutor) => (
            <TableRow key={tutor.idtutor}>
              <TableCell>{tutor.idtutor}</TableCell>
              <TableCell>{tutor.nombre_completo}</TableCell>
              <TableCell>{tutor.curp}</TableCell>
              <TableCell>{tutor.telefono}</TableCell>
              <TableCell>{tutor.correo}</TableCell>
              <TableCell>{tutor.alumno_nombre}</TableCell>
              <TableCell>{tutor.alumno_curp}</TableCell>
              <TableCell>{tutor.estado_documentos}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(tutor.idtutor)}
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

export default TutoresDashboard;
