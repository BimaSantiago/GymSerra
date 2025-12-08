import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  Pencil,
  Trash2,
  Calendar,
  Dumbbell,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import {
  Command,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface Noticia {
  idnoticias: number;
  titulo: string;
  descripcion: string;
  fecha_publicacion: string;
  imagen: string;
  deporte: string;
  ubicacion: string;
  fecha_inicio: string;
  fecha_fin: string;
  iddeporte: number;
  idevento: number;
}

interface Deporte {
  iddeporte: number;
  nombre: string;
}

interface Evento {
  idevento: number;
  ubicacion: string;
  fecha_inicio: string;
  fecha_fin: string;
}

interface ListNoticiasResponse {
  success: boolean;
  noticias?: Noticia[];
  total?: number;
  error?: string;
}

interface ListDeportesResponse {
  success: boolean;
  deportes?: { iddeporte: number | string; nombre: string }[];
  error?: string;
}

interface ListEventosResponse {
  success: boolean;
  eventos?: {
    idevento: number | string;
    ubicacion: string;
    fecha_inicio: string;
    fecha_fin: string;
  }[];
  error?: string;
}

interface CrudResponse {
  success: boolean;
  message?: string;
  error?: string;
  noticia?: {
    idnoticias: number | string;
    titulo: string;
    descripcion: string;
    iddeporte: number | string;
    idevento: number | string;
    imagen: string;
  };
}

const API_BASE = "http://localhost/GymSerra/public";

const NoticiasDashboard: React.FC = () => {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [filteredEventos, setFilteredEventos] = useState<Evento[]>([]);
  const [searchEvento, setSearchEvento] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    idnoticias: 0,
    titulo: "",
    descripcion: "",
    iddeporte: 0,
    idevento: 0,
    imagen: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEventMenuOpen, setIsEventMenuOpen] = useState(false);

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 🔹 Autocerrar alertas
  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 3000);
    return () => clearTimeout(t);
  }, [alert]);

  // 🔹 Fetch de noticias (paginado + búsqueda)
  const fetchNoticias = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/noticias.php?action=listExtended&page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data: ListNoticiasResponse = await response.json();
      if (data.success) {
        setNoticias(data.noticias || []);
        setTotal(data.total || 0);
      } else {
        setAlert({
          type: "error",
          message: data.error || "Error al obtener noticias",
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setAlert({
        type: "error",
        message: "Error de conexión al obtener noticias",
      });
    }
  };

  const fetchDeportes = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/noticias.php?action=listDeportes`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ListDeportesResponse = await res.json();
      if (data.success && data.deportes) {
        setDeportes(
          data.deportes.map((d) => ({
            iddeporte: Number(d.iddeporte),
            nombre: d.nombre,
          }))
        );
      }
    } catch {
      // podemos omitir la alerta, solo no habrá deportes
    }
  };

  const fetchEventos = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/noticias.php?action=listEventos`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ListEventosResponse = await res.json();
      if (data.success && data.eventos) {
        const evs: Evento[] = data.eventos.map((e) => ({
          idevento: Number(e.idevento),
          ubicacion: e.ubicacion,
          fecha_inicio: e.fecha_inicio,
          fecha_fin: e.fecha_fin,
        }));
        setEventos(evs);
        setFilteredEventos(evs);
      }
    } catch {
      // sin eventos no se rompe nada
    }
  };

  useEffect(() => {
    fetchNoticias();
  }, [page, search]);

  useEffect(() => {
    fetchDeportes();
    fetchEventos();
  }, []);

  // 🔹 Filtro de eventos por texto
  useEffect(() => {
    const term = searchEvento.toLowerCase();
    const filtered = eventos.filter(
      (e) =>
        e.ubicacion.toLowerCase().includes(term) ||
        e.fecha_inicio.toLowerCase().includes(term) ||
        e.fecha_fin.toLowerCase().includes(term)
    );
    setFilteredEventos(filtered);
  }, [searchEvento, eventos]);

  // 🔹 Cerrar menú de eventos al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsEventMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const resetForm = () => {
    setForm({
      idnoticias: 0,
      titulo: "",
      descripcion: "",
      iddeporte: 0,
      idevento: 0,
      imagen: "",
    });
    setFile(null);
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing
      ? `${API_BASE}/api/noticias.php?action=update`
      : `${API_BASE}/api/noticias.php?action=create`;

    const formData = new FormData();
    formData.append("idnoticias", form.idnoticias.toString());
    formData.append("titulo", form.titulo);
    formData.append("descripcion", form.descripcion);
    formData.append("iddeporte", form.iddeporte.toString());
    formData.append("idevento", form.idevento.toString());
    if (file) formData.append("imagen", file);

    try {
      const response = await fetch(url, { method: "POST", body: formData });
      const data: CrudResponse = await response.json();

      if (data.success) {
        setAlert({
          type: "success",
          message: isEditing
            ? "Noticia actualizada correctamente"
            : "Noticia creada correctamente",
        });
        fetchNoticias();
        setIsDialogOpen(false);
        resetForm();
      } else {
        setAlert({
          type: "error",
          message: data.error || "Error al guardar la noticia",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Error de conexión al guardar la noticia",
      });
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/noticias.php?action=get&idnoticias=${id}`
      );
      const data: CrudResponse = await response.json();
      if (data.success && data.noticia) {
        const n = data.noticia;
        setForm({
          idnoticias: Number(n.idnoticias),
          titulo: n.titulo,
          descripcion: n.descripcion,
          iddeporte: Number(n.iddeporte),
          idevento: Number(n.idevento),
          imagen: n.imagen || "",
        });
        setFile(null);
        setIsEditing(true);
        setIsDialogOpen(true);
      } else {
        setAlert({
          type: "error",
          message: data.error || "Error al obtener la noticia",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Error de conexión al obtener la noticia",
      });
    }
  };

  const confirmDelete = (id: number) => {
    setSelectedDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!selectedDeleteId) return;
    try {
      const response = await fetch(
        `${API_BASE}/api/noticias.php?action=delete&idnoticias=${selectedDeleteId}`,
        { method: "POST" }
      );
      const data: CrudResponse = await response.json();
      if (data.success) {
        setAlert({
          type: "success",
          message: "Noticia eliminada correctamente",
        });
        fetchNoticias();
      } else {
        setAlert({
          type: "error",
          message: data.error || "Error al eliminar la noticia",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Error de conexión al eliminar la noticia",
      });
    }

    setDeleteDialogOpen(false);
    setSelectedDeleteId(null);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-6">
      {/* Alertas */}
      {alert && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="mb-6 rounded-xl shadow-lg"
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

      {/* Confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl shadow-2xl border border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              ¿Eliminar noticia?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              noticia del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg border-gray-300 hover:bg-accent">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-red-600 text-white hover:bg-red-700 rounded-lg"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Barra superior: búsqueda + modal */}
      <div className="flex justify-between items-center mb-6">
        <Input
          placeholder="Buscar noticia por título, descripción o deporte..."
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
              Agregar Noticia
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Noticia" : "Nueva Noticia"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 relative">
              <div>
                <Label>Título</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
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

              {/* Select de deporte */}
              <div>
                <Label>Deporte</Label>
                <Select
                  value={form.iddeporte ? form.iddeporte.toString() : ""}
                  onValueChange={(value) =>
                    setForm({ ...form, iddeporte: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar deporte" />
                  </SelectTrigger>
                  <SelectContent>
                    {deportes.map((d) => (
                      <SelectItem
                        key={d.iddeporte}
                        value={d.iddeporte.toString()}
                      >
                        {d.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selector de evento (combinado) */}
              <div className="relative" ref={menuRef}>
                <Label>Evento</Label>
                <div
                  className="flex items-center justify-between border rounded-lg px-3 py-2 cursor-text hover:border-gray-400 transition"
                  onClick={() => setIsEventMenuOpen(true)}
                >
                  <input
                    type="text"
                    placeholder="Seleccionar evento..."
                    value={
                      isEventMenuOpen
                        ? searchEvento
                        : form.idevento
                        ? eventos.find((e) => e.idevento === form.idevento)
                            ?.ubicacion || ""
                        : ""
                    }
                    onFocus={() => setIsEventMenuOpen(true)}
                    onChange={(e) => {
                      setSearchEvento(e.target.value);
                      setIsEventMenuOpen(true);
                    }}
                    className="w-full outline-none bg-transparent text-sm"
                  />
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>

                {isEventMenuOpen && (
                  <div className="absolute z-50 mt-1 w-full  border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    <Command>
                      <CommandList>
                        {filteredEventos.length > 0 ? (
                          filteredEventos.map((e) => (
                            <CommandItem
                              key={e.idevento}
                              onSelect={() => {
                                setForm({ ...form, idevento: e.idevento });
                                setSearchEvento("");
                                setIsEventMenuOpen(false);
                              }}
                              className="cursor-pointer hover:bg-accent px-3 py-2"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                  {e.ubicacion}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    e.fecha_inicio
                                  ).toLocaleDateString()}{" "}
                                  - {new Date(e.fecha_fin).toLocaleDateString()}
                                </span>
                              </div>
                            </CommandItem>
                          ))
                        ) : (
                          <CommandEmpty className="px-3 py-2 text-gray-500">
                            No se encontraron eventos.
                          </CommandEmpty>
                        )}
                      </CommandList>
                    </Command>
                  </div>
                )}
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
                className="bg-gray-800 text-white hover:bg-gray-700 w-full rounded-lg"
              >
                {isEditing ? "Actualizar" : "Crear"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {noticias.map((n) => (
          <Card
            key={n.idnoticias}
            className="shadow-lg rounded-xl border hover:shadow-xl transition bg-secondary"
          >
            <CardHeader className="p-0">
              <img
                src={`${API_BASE}/${n.imagen}`}
                alt={n.titulo}
                className="h-48 w-full object-cover rounded-t-xl"
              />
            </CardHeader>
            <CardContent className="p-2">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">
                {n.titulo}
              </h3>
              <p className="text-sm text-gray-300">{n.descripcion}</p>
              <div className="mt-4 text-sm text-gray-300 space-y-1">
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-gray-400" />{" "}
                  <span>{n.deporte}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-400" />{" "}
                  <span>{n.ubicacion}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    {new Date(n.fecha_inicio).toLocaleDateString()} -{" "}
                    {new Date(n.fecha_fin).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center px-4 py-1">
              <p className="text-xs text-gray-200">
                Publicado: {new Date(n.fecha_publicacion).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(n.idnoticias)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => confirmDelete(n.idnoticias)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center mt-8">
        <Button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="bg-gray-800 text-white hover:bg-gray-700"
        >
          Anterior
        </Button>
        <span className="text-gray-300">
          Página {page} de {totalPages}
        </span>
        <Button
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage(page + 1)}
          className="bg-gray-800 text-white hover:bg-gray-700"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};

export default NoticiasDashboard;
