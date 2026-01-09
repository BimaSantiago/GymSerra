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
import { AlertCircle, CheckCircle2, Pencil, Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  iduser: number;
  username: string;
  passw?: string;
  avatar?: string;

  nombre: string;
  appaterno: string;
  apmaterno: string;
  correo: string;
  genero: string;
  rol: "Administrador" | "Estandar";
  estatus: "activo" | "inactivo" | "bloqueado";
}

const emptyUser: User = {
  iduser: 0,
  username: "",
  passw: "",
  avatar: "",
  nombre: "",
  appaterno: "",
  apmaterno: "",
  correo: "",
  genero: "",
  rol: "Estandar",
  estatus: "activo",
};

const UsersDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<User>(emptyUser);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const API_URL = "http://localhost/GymSerra/public/api/users.php";

  /* ==================== FETCH ==================== */
  const fetchUsers = async () => {
    const response = await fetch(
      `${API_URL}?action=list&page=${page}&limit=${limit}&search=${encodeURIComponent(
        search
      )}`
    );
    const data = await response.json();
    if (data.success) {
      setUsers(data.users);
      setTotal(data.total);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const totalPages = Math.ceil(total / limit) || 1;

  /* ==================== FORM ==================== */
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFile(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing
      ? `${API_URL}?action=update`
      : `${API_URL}?action=create`;

    const formData = new FormData();
    formData.append("iduser", form.iduser.toString());
    formData.append("username", form.username);
    if (form.passw) formData.append("passw", form.passw);
    formData.append("nombre", form.nombre);
    formData.append("appaterno", form.appaterno);
    formData.append("apmaterno", form.apmaterno);
    formData.append("correo", form.correo);
    formData.append("genero", form.genero);
    formData.append("rol", form.rol);
    formData.append("estatus", form.estatus);
    if (file) formData.append("avatar", file);

    const res = await fetch(url, { method: "POST", body: formData });
    const data = await res.json();

    if (data.success) {
      setAlert({ type: "success", message: data.msg || "Operación exitosa" });
      fetchUsers();
      resetForm();
      setIsDialogOpen(false);
    } else {
      setAlert({
        type: "error",
        message: data.error || "Error en la operación",
      });
    }

    setTimeout(() => setAlert(null), 3000);
  };

  const handleEdit = async (iduser: number) => {
    const res = await fetch(`${API_URL}?action=get&iduser=${iduser}`);
    const data = await res.json();
    if (data.success) {
      const u: User = {
        ...emptyUser,
        ...data.user,
      };
      setForm(u);
      setPreview(
        u.avatar ? `http://localhost/GymSerra/public/${u.avatar}` : null
      );
      setIsEditing(true);
      setIsDialogOpen(true);
    } else {
      setAlert({
        type: "error",
        message: data.error || "No se pudo cargar el usuario",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const resetForm = () => {
    setForm(emptyUser);
    setFile(null);
    setPreview(null);
    setIsEditing(false);
  };

  /* ==================== RENDER ==================== */
  return (
    <div className="p-4 space-y-4">
      {alert && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="mb-4 rounded-2xl shadow-lg"
        >
          {alert.type === "success" ? <CheckCircle2 /> : <AlertCircle />}
          <AlertTitle>
            {alert.type === "success" ? "Éxito" : "Error"}
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between gap-4 flex-wrap">
        <Input
          placeholder="Buscar usuario por nombre/usuario/correo..."
          value={search}
          onChange={handleSearch}
          className="max-w-sm rounded-lg shadow-md"
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg"
            >
              Agregar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Datos de acceso */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre de usuario</Label>
                  <Input
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label>Contraseña</Label>
                  <Input
                    type="password"
                    placeholder={isEditing ? "Dejar vacío para no cambiar" : ""}
                    value={form.passw || ""}
                    onChange={(e) =>
                      setForm({ ...form, passw: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Datos personales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={form.nombre}
                    onChange={(e) =>
                      setForm({ ...form, nombre: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Apellido paterno</Label>
                  <Input
                    value={form.appaterno}
                    onChange={(e) =>
                      setForm({ ...form, appaterno: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Apellido materno</Label>
                  <Input
                    value={form.apmaterno}
                    onChange={(e) =>
                      setForm({ ...form, apmaterno: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label>Correo</Label>
                  <Input
                    type="email"
                    value={form.correo}
                    onChange={(e) =>
                      setForm({ ...form, correo: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Género</Label>
                  <Select
                    value={form.genero}
                    onValueChange={(value) =>
                      setForm({ ...form, genero: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Rol y estatus */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Rol</Label>
                  <Select
                    value={form.rol}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        rol: value as User["rol"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrador">
                        Administrador
                      </SelectItem>
                      <SelectItem value="Estandar">Estándar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estatus</Label>
                  <Select
                    value={form.estatus}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        estatus: value as User["estatus"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona estatus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                      <SelectItem value="bloqueado">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Avatar */}
              <div className="flex flex-col gap-2">
                <Label>Avatar</Label>
                <div className="flex items-center gap-4">
                  <div className="max-w-20 h-20 border rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Vista previa"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <Upload className="opacity-40 w-6 h-6" />
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg w-full"
              >
                {isEditing ? "Actualizar" : "Guardar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de usuarios */}
      <Table className="rounded-lg shadow-md">
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estatus</TableHead>
            <TableHead>Avatar</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.iduser}>
              <TableCell>{u.iduser}</TableCell>
              <TableCell>{u.username}</TableCell>
              <TableCell>
                {u.nombre} {u.appaterno} {u.apmaterno}
              </TableCell>
              <TableCell>{u.correo}</TableCell>
              <TableCell>{u.rol}</TableCell>
              <TableCell className="capitalize">{u.estatus}</TableCell>
              <TableCell>
                {u.avatar ? (
                  <img
                    src={`http://localhost/GymSerra/public/${u.avatar}`}
                    alt="avatar"
                    className="h-12 w-12 rounded-full object-cover border"
                  />
                ) : (
                  "Sin imagen"
                )}
              </TableCell>
              <TableCell className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(u.iduser)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Paginación */}
      <div className="flex justify-between mt-4 items-center">
        <Button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="bg-gray-800 text-white hover:bg-gray-700"
        >
          Anterior
        </Button>
        <span>
          Página {page} de {totalPages}
        </span>
        <Button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="bg-gray-800 text-white hover:bg-gray-700"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};

export default UsersDashboard;
