import React, { useEffect, useMemo, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE = "https://academiagymserra.garzas.store";

interface Categoria {
  idcategoria: number;
  nombre: string;
  id_padre: number | null;
  nombre_padre?: string | null;
}

interface ApiListResponse {
  success: boolean;
  categorias?: Categoria[];
  total?: number;
  error?: string;
}

interface ApiCrudResponse {
  success: boolean;
  error?: string;
  idcategoria?: number;
  msg?: string;
}

const CategoriasDashboard: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState<{
    idcategoria: number;
    nombre: string;
    id_padre: number | null;
  }>({
    idcategoria: 0,
    nombre: "",
    id_padre: null,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<string>("todas");

  const totalPages = Math.ceil(total / limit) || 1;

  /* ==================== HELPERS: ÁRBOLES, NIVELES Y RUTAS ==================== */

  const categoriasPorId = useMemo(() => {
    const map = new Map<number, Categoria>();
    categorias.forEach((c) => map.set(c.idcategoria, c));
    return map;
  }, [categorias]);

  const topLevelCategorias = useMemo(
    () => categorias.filter((c) => c.id_padre === null),
    [categorias]
  );

  const getDepth = (cat: Categoria, cache: Map<number, number>): number => {
    if (cache.has(cat.idcategoria)) return cache.get(cat.idcategoria)!;
    if (cat.id_padre == null) {
      cache.set(cat.idcategoria, 1);
      return 1;
    }
    const parent = categoriasPorId.get(cat.id_padre);
    if (!parent) {
      cache.set(cat.idcategoria, 1);
      return 1;
    }
    const depth = getDepth(parent, cache) + 1;
    cache.set(cat.idcategoria, depth);
    return depth;
  };

  const getPath = (cat: Categoria): string => {
    const path: string[] = [cat.nombre];
    let current = cat;
    while (current.id_padre != null) {
      const parent = categoriasPorId.get(current.id_padre);
      if (!parent) break;
      path.push(parent.nombre);
      current = parent;
    }
    return path.reverse().join(" → ");
  };

  const getCategoriasPorRaiz = (rootId: number): Categoria[] => {
    const result: Categoria[] = [];
    const queue: number[] = [rootId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const current = categoriasPorId.get(currentId);
      if (!current) continue;

      result.push(current);

      categorias.forEach((c) => {
        if (c.id_padre === currentId) {
          queue.push(c.idcategoria);
        }
      });
    }

    const depthCache = new Map<number, number>();
    return result.sort((a, b) => {
      const da = getDepth(a, depthCache);
      const db = getDepth(b, depthCache);
      if (da !== db) return da - db;
      return a.nombre.localeCompare(b.nombre);
    });
  };

  /* ==================== FETCH ==================== */

  const fetchCategorias = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/categorias.php?action=list&page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`
      );
      const data: ApiListResponse = await response.json();

      if (data.success && data.categorias) {
        setCategorias(
          data.categorias.map((c) => ({
            ...c,
            idcategoria: Number(c.idcategoria),
            id_padre:
              c.id_padre !== null && c.id_padre !== undefined
                ? Number(c.id_padre)
                : null,
          }))
        );
        setTotal(data.total ?? data.categorias.length);
      } else {
        setCategorias([]);
        setTotal(0);
        if (data.error) {
          setAlert({ type: "error", message: data.error });
          setTimeout(() => setAlert(null), 3000);
        }
      }
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      setCategorias([]);
      setTotal(0);
      setAlert({
        type: "error",
        message: "Error de conexión al obtener categorías",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  useEffect(() => {
    fetchCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  /* ==================== EVENTOS ==================== */

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const resetForm = () => {
    setForm({
      idcategoria: 0,
      nombre: "",
      id_padre: null,
    });
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = isEditing
      ? `${API_BASE}/api/categorias.php?action=update`
      : `${API_BASE}/api/categorias.php?action=create`;

    const payload = {
      idcategoria: form.idcategoria,
      nombre: form.nombre,
      id_padre: form.id_padre,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: ApiCrudResponse = await response.json();

      if (data.success) {
        setAlert({
          type: "success",
          message: data.msg
            ? data.msg
            : isEditing
            ? "Categoría actualizada correctamente"
            : "Categoría creada correctamente",
        });
        setIsDialogOpen(false);
        resetForm();
        fetchCategorias();
      } else {
        setAlert({
          type: "error",
          message: data.error || "Error al guardar la categoría",
        });
      }
    } catch (error) {
      console.error("Error al guardar categoría:", error);
      setAlert({
        type: "error",
        message: "Error de conexión al guardar la categoría",
      });
    } finally {
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setForm({
      idcategoria: categoria.idcategoria,
      nombre: categoria.nombre,
      id_padre: categoria.id_padre ?? null,
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  /* ==================== RENDER ==================== */

  const depthCacheForRender = useMemo(() => new Map<number, number>(), []);
  const getDepthSafe = (cat: Categoria) => getDepth(cat, depthCacheForRender);

  const renderTabla = (rows: Categoria[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Categoria Raiz</TableHead>
          <TableHead>Nivel</TableHead>
          <TableHead>Ruta</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((c) => {
          const depth = getDepthSafe(c);
          const nivelLabel =
            depth === 1
              ? "Nivel 1 (Principal)"
              : `Nivel ${depth} (Subcategoría)`;

          return (
            <TableRow key={c.idcategoria}>
              <TableCell>{c.idcategoria}</TableCell>
              <TableCell>{c.nombre}</TableCell>
              <TableCell>{c.nombre_padre ?? "-"}</TableCell>
              <TableCell>{nivelLabel}</TableCell>
              <TableCell>{getPath(c)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(c)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}

        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-gray-500 py-6">
              No hay categorías para mostrar
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const allSorted = useMemo(() => {
    const depthCache = new Map<number, number>();
    return [...categorias].sort((a, b) => {
      const da = getDepth(a, depthCache);
      const db = getDepth(b, depthCache);
      if (da !== db) return da - db;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [categorias]);

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

      {/* Filtros y botón */}
      <div className="flex justify-between mb-4">
        <Input
          placeholder="Buscar por nombre o padre..."
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
              Agregar categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar categoría" : "Nueva categoría"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-600 mb-1.5 block">
                  Nombre
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
                  Categoría raiz (opcional)
                </Label>
                <Select
                  value={
                    form.id_padre !== null ? String(form.id_padre) : "none"
                  }
                  onValueChange={(value) => {
                    if (value === "none") {
                      setForm({ ...form, id_padre: null });
                    } else {
                      const id = Number(value);
                      if (id === form.idcategoria) return;
                      setForm({ ...form, id_padre: id });
                    }
                  }}
                >
                  <SelectTrigger className="rounded-lg shadow-sm">
                    <SelectValue placeholder="Selecciona padre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      Sin categoría padre (principal)
                    </SelectItem>
                    {categorias
                      .filter((c) => c.idcategoria !== form.idcategoria)
                      .map((c) => (
                        <SelectItem
                          key={c.idcategoria}
                          value={String(c.idcategoria)}
                        >
                          {getPath(c)}
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

      {/* Tabs por categoría principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          {topLevelCategorias.map((cat) => (
            <TabsTrigger key={cat.idcategoria} value={`cat-${cat.idcategoria}`}>
              {cat.nombre}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="todas">{renderTabla(allSorted)}</TabsContent>

        {topLevelCategorias.map((root) => (
          <TabsContent key={root.idcategoria} value={`cat-${root.idcategoria}`}>
            {renderTabla(getCategoriasPorRaiz(root.idcategoria))}
          </TabsContent>
        ))}
      </Tabs>

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

export default CategoriasDashboard;
