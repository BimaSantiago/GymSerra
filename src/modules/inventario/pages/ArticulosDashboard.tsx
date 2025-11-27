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

interface Articulo {
  idarticulo: number;
  nombre: string;
  codigo_barras: string;
  descripcion: string;
  descripcion2: string;
  estado: string;
  stock: number;
  img: string;
}

const ArticulosDashboard = () => {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    idarticulo: 0,
    nombre: "",
    codigo_barras: "",
    descripcion: "",
    descripcion2: "Mobiliario",
    estado: "Activo",
    img: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Obtener artículos con paginación y búsqueda
  const fetchArticulos = async () => {
    const response = await fetch(
      `http://localhost/GymSerra/public/api/articulos.php?action=list&page=${page}&limit=${limit}&search=${search}`
    );
    const data = await response.json();
    setArticulos(data.articulos);
    setTotal(data.total);
  };

  useEffect(() => {
    fetchArticulos();
  }, [page, search]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  //  Crear / actualizar artículo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing
      ? "http://localhost/GymSerra/public/api/articulos.php?action=update"
      : "http://localhost/GymSerra/public/api/articulos.php?action=create";

    const formData = new FormData();

    // Asegúrate de que los campos coincidan con los nombres del backend
    formData.append("idarticulo", form.idarticulo.toString());
    formData.append("nombre", form.nombre);
    formData.append("codigo_barras", form.codigo_barras);
    formData.append("descripcion", form.descripcion);
    formData.append("descripcion2", form.descripcion2);
    formData.append("estado", form.estado);

    // 🔹 Agregamos la imagen solo si existe
    if (file) {
      formData.append("imagen", file);
    }

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      setAlert({
        type: "success",
        message: isEditing
          ? "Artículo actualizado correctamente"
          : "Artículo creado correctamente",
      });
      fetchArticulos();
      setIsDialogOpen(false);
      resetForm();
    } else {
      setAlert({ type: "error", message: data.error || "Error al guardar" });
    }

    setTimeout(() => setAlert(null), 3000);
  };

  // Editar artículo existente
  const handleEdit = async (idarticulo: number) => {
    const response = await fetch(
      `http://localhost/GymSerra/public/api/articulos.php?action=get&idarticulo=${idarticulo}`
    );
    const data = await response.json();
    if (data.success) {
      setForm(data.articulo);
      setIsEditing(true);
      setIsDialogOpen(true);
    } else {
      setAlert({ type: "error", message: data.error });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const resetForm = () => {
    setForm({
      idarticulo: 0,
      nombre: "",
      codigo_barras: "",
      descripcion: "",
      descripcion2: "Mobiliario",
      estado: "Activo",
      img: "",
    });
    setFile(null);
    setIsEditing(false);
  };

  // 🔹 Dividir por tipo
  const mobiliario = articulos.filter((a) => a.descripcion2 === "Mobiliario");
  const venta = articulos.filter((a) => a.descripcion2 === "Venta");

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
          placeholder="Buscar por nombre, código o descripción..."
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
              Agregar Artículo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Artículo" : "Nuevo Artículo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Código de Barras</Label>
                <Input
                  value={form.codigo_barras}
                  onChange={(e) =>
                    setForm({ ...form, codigo_barras: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Descripción</Label>
                <Input
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Tipo</Label>
                <Select
                  value={form.descripcion2}
                  onValueChange={(value) =>
                    setForm({ ...form, descripcion2: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mobiliario">Mobiliario</SelectItem>
                    <SelectItem value="Venta">Venta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Estado</Label>
                <Select
                  value={form.estado}
                  onValueChange={(value) => setForm({ ...form, estado: value })}
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

              <div>
                <Label>Imagen</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
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

      <h2 className="text-xl font-semibold text-gray-800 mb-2">Mobiliario</h2>
      <Table className="mb-8 border border-gray-200 rounded-lg shadow-sm">
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Imagen</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mobiliario.map((art) => (
            <TableRow key={art.idarticulo}>
              <TableCell>{art.idarticulo}</TableCell>
              <TableCell>{art.nombre}</TableCell>
              <TableCell>{art.codigo_barras}</TableCell>
              <TableCell>{art.estado}</TableCell>
              <TableCell>{art.stock}</TableCell>
              <TableCell>
                {art.img ? (
                  <img
                    src={`http://localhost/GymSerra/public/${art.img}`}
                    alt=""
                    className="h-10 rounded"
                  />
                ) : (
                  "Sin imagen"
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(art.idarticulo)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Artículos de Venta
      </h2>
      <Table className="border border-gray-200 rounded-lg shadow-sm">
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Imagen</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {venta.map((art) => (
            <TableRow key={art.idarticulo}>
              <TableCell>{art.idarticulo}</TableCell>
              <TableCell>{art.nombre}</TableCell>
              <TableCell>{art.codigo_barras}</TableCell>
              <TableCell>{art.estado}</TableCell>
              <TableCell>{art.stock}</TableCell>
              <TableCell>
                {art.img ? (
                  <img
                    src={`http://localhost/GymSerra/public/${art.img}`}
                    alt=""
                    className="h-10 rounded"
                  />
                ) : (
                  "Sin imagen"
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(art.idarticulo)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 🔹 Paginación */}
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

export default ArticulosDashboard;
