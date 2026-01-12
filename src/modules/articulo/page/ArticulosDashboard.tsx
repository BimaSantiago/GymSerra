import type { FormEvent } from "react";
import "../style/articulo.css";
import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { AlertCircle, CheckCircle2, Pencil, ChevronDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

const API_BASE = "https://academiagymserra.garzas.store";

interface Articulo {
  idarticulo: number;
  nombre: string;
  codigo_barras: string;
  descripcion: string;
  descripcion2: string;
  estado: string;
  stock: number;
  img: string;
  ganancia: number;
  iva_aplicable: "Si" | "No";
  idunidad: number;
  idcategoria: number;
  unidad_clave: string;
  unidad_descripcion: string;
  categoria_nombre: string;
}

interface UnidadMedida {
  idunidad: number;
  clave: string;
  descripcion: string;
  tipo: string | null;
}

interface Categoria {
  idcategoria: number;
  nombre: string;
  id_padre: number | null;
}

interface Proveedor {
  idproveedor: number;
  nombre: string;
  RFC: string;
  telefono: string;
  correo: string;
  estado: string;
  nombre_vendedor: string;
  telefono_vendedor: string;
  correo_vendedor: string;
}

const ArticulosDashboard: React.FC = () => {
  // Todos los artículos
  const [articulos, setArticulos] = useState<Articulo[]>([]);

  // Unidades, categorías, proveedores
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // Formulario (sin stock)
  const [form, setForm] = useState({
    idarticulo: 0,
    nombre: "",
    codigo_barras: "",
    descripcion: "",
    descripcion2: "Mobiliario",
    estado: "Activo",
    img: "",
    ganancia: 0,
    iva_aplicable: "Si" as "Si" | "No",
    idunidad: 0,
    idcategoria: 0,
  });
  const [file, setFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Alertas
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Tabs (artículos)
  const [activeTab, setActiveTab] = useState<"Mobiliario" | "Venta">(
    "Mobiliario"
  );

  // Search independiente por tab
  const [searchMobiliario, setSearchMobiliario] = useState("");
  const [searchVenta, setSearchVenta] = useState("");

  // Paginación independiente por tab
  const [pageMobiliario, setPageMobiliario] = useState(1);
  const [pageVenta, setPageVenta] = useState(1);
  const limitMobiliario = 10;
  const limitVenta = 10;

  // Estados para Command (categoría y unidad)
  const [searchCategoria, setSearchCategoria] = useState("");
  const [searchUnidad, setSearchUnidad] = useState("");
  const [isCategoriaOpen, setIsCategoriaOpen] = useState(false);
  const [isUnidadOpen, setIsUnidadOpen] = useState(false);
  const categoriaRef = useRef<HTMLDivElement | null>(null);
  const unidadRef = useRef<HTMLDivElement | null>(null);

  // === Vincular proveedor ===
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkingArticleId, setLinkingArticleId] = useState<number | null>(null);
  const [selectedProveedorId, setSelectedProveedorId] = useState<number | null>(
    null
  );
  const [proveedorSearch, setProveedorSearch] = useState("");
  const [linkTab, setLinkTab] = useState<"existente" | "nuevo">("existente");

  // Wizard proveedor
  const [provStep, setProvStep] = useState<1 | 2>(1);
  const [provForm, setProvForm] = useState({
    idproveedor: 0,
    nombre: "",
    RFC: "",
    codigo_postal: "",
    calle: "",
    localidad: "",
    municipio: "",
    telefono: "",
    correo: "",
    estado: "Activo",
    nombre_vendedor: "",
    telefono_vendedor: "",
    correo_vendedor: "",
  });

  // Cerrar menus de categoria/unidad al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoriaRef.current &&
        !categoriaRef.current.contains(event.target as Node)
      ) {
        setIsCategoriaOpen(false);
      }
      if (
        unidadRef.current &&
        !unidadRef.current.contains(event.target as Node)
      ) {
        setIsUnidadOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ====================== FETCHS ======================

  const fetchArticulos = async () => {
    const response = await fetch(
      `${API_BASE}/api/articulos.php?action=list&page=1&limit=1000&search=`
    );
    const data = await response.json();
    setArticulos(data.articulos || []);
  };

  const fetchUnidades = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/unidad_medida.php?action=list&page=1&limit=1000&search=`
      );
      const data = await res.json();
      if (data.success) {
        setUnidades(data.unidades || data.unidades_medida || []);
      }
    } catch (e) {
      console.error("Error al obtener unidades de medida", e);
    }
  };

  const fetchCategorias = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/categorias.php?action=list&page=1&limit=1000&search=`
      );
      const data = await res.json();
      if (data.success) {
        setCategorias(data.categorias || []);
      }
    } catch (e) {
      console.error("Error al obtener categorías", e);
    }
  };

  const fetchProveedores = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/proveedores.php?action=list&page=1&limit=1000&search=`
      );
      const data = await res.json();
      if (data.success) {
        setProveedores(data.proveedores || []);
      }
    } catch (e) {
      console.error("Error al obtener proveedores", e);
    }
  };

  useEffect(() => {
    fetchArticulos();
    fetchUnidades();
    fetchCategorias();
  }, []);

  // ====================== FILTROS Y PAGINACIÓN POR TAB ======================

  const filtrarArticuloPorBusqueda = (a: Articulo, search: string) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      a.nombre.toLowerCase().includes(term) ||
      (a.codigo_barras || "").toLowerCase().includes(term) ||
      (a.categoria_nombre || "").toLowerCase().includes(term)
    );
  };

  const mobiliario = useMemo(
    () =>
      articulos.filter(
        (a) =>
          a.descripcion2 === "Mobiliario" &&
          filtrarArticuloPorBusqueda(a, searchMobiliario)
      ),
    [articulos, searchMobiliario]
  );

  const venta = useMemo(
    () =>
      articulos.filter(
        (a) =>
          a.descripcion2 === "Venta" &&
          filtrarArticuloPorBusqueda(a, searchVenta)
      ),
    [articulos, searchVenta]
  );

  const totalMobiliario = mobiliario.length;
  const totalVenta = venta.length;

  const totalPagesMobiliario =
    Math.ceil(totalMobiliario / limitMobiliario) || 1;
  const totalPagesVenta = Math.ceil(totalVenta / limitVenta) || 1;

  const mobiliarioPageSlice = useMemo(() => {
    const start = (pageMobiliario - 1) * limitMobiliario;
    return mobiliario.slice(start, start + limitMobiliario);
  }, [mobiliario, pageMobiliario]);

  const ventaPageSlice = useMemo(() => {
    const start = (pageVenta - 1) * limitVenta;
    return venta.slice(start, start + limitVenta);
  }, [venta, pageVenta]);

  useEffect(() => {
    setPageMobiliario(1);
  }, [searchMobiliario]);

  useEffect(() => {
    setPageVenta(1);
  }, [searchVenta]);

  // ====================== VINCULAR PROVEEDOR ======================

  const linkArticuloProveedor = async (
    idarticulo: number,
    idproveedor: number
  ) => {
    const resp = await fetch(
      `${API_BASE}/api/articulos.php?action=link_proveedor`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idarticulo, idproveedor }),
      }
    );
    const data = await resp.json();
    if (!data.success) {
      setAlert({
        type: "error",
        message: data.error || "Error al vincular el proveedor",
      });
      setTimeout(() => setAlert(null), 3000);
      return false;
    }
    setAlert({
      type: "success",
      message: "Proveedor vinculado correctamente al artículo.",
    });
    setTimeout(() => setAlert(null), 3000);
    return true;
  };

  const handleLinkProveedor = async () => {
    if (!linkingArticleId || !selectedProveedorId) {
      setAlert({
        type: "error",
        message: "Selecciona un proveedor para vincular.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }
    const ok = await linkArticuloProveedor(
      linkingArticleId,
      selectedProveedorId
    );
    if (ok) {
      setIsLinkDialogOpen(false);
      setLinkingArticleId(null);
      setSelectedProveedorId(null);
      setProveedorSearch("");
    }
  };

  const handleCreateProveedorFromWizard = async (e: FormEvent) => {
    e.preventDefault();

    if (
      !provForm.nombre ||
      !provForm.RFC ||
      !provForm.calle ||
      !provForm.localidad ||
      !provForm.municipio ||
      !provForm.telefono ||
      !provForm.correo ||
      !provForm.nombre_vendedor ||
      !provForm.telefono_vendedor ||
      !provForm.correo_vendedor
    ) {
      setAlert({
        type: "error",
        message:
          "Completa los datos obligatorios del proveedor y del vendedor.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    const resp = await fetch(`${API_BASE}/api/proveedores.php?action=create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(provForm),
    });
    const data = await resp.json();

    if (!data.success) {
      setAlert({
        type: "error",
        message: data.error || "Error al crear el proveedor",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    const newId = data.idproveedor as number;
    const nuevoProveedor: Proveedor = {
      idproveedor: newId,
      nombre: provForm.nombre,
      RFC: provForm.RFC,
      telefono: provForm.telefono,
      correo: provForm.correo,
      estado: provForm.estado,
      nombre_vendedor: provForm.nombre_vendedor,
      telefono_vendedor: provForm.telefono_vendedor,
      correo_vendedor: provForm.correo_vendedor,
    };

    setProveedores((prev) => [...prev, nuevoProveedor]);

    if (linkingArticleId) {
      const ok = await linkArticuloProveedor(linkingArticleId, newId);
      if (ok) {
        setIsLinkDialogOpen(false);
        setLinkingArticleId(null);
        setSelectedProveedorId(null);
        setProveedorSearch("");
        setProvStep(1);
        setProvForm({
          idproveedor: 0,
          nombre: "",
          RFC: "",
          codigo_postal: "",
          calle: "",
          localidad: "",
          municipio: "",
          telefono: "",
          correo: "",
          estado: "Activo",
          nombre_vendedor: "",
          telefono_vendedor: "",
          correo_vendedor: "",
        });
      }
    }
  };

  // ====================== HANDLERS ======================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.idunidad || !form.idcategoria) {
      setAlert({
        type: "error",
        message: "Selecciona una categoría y una unidad de medida.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    const url = isEditing
      ? `${API_BASE}/api/articulos.php?action=update`
      : `${API_BASE}/api/articulos.php?action=create`;

    const formData = new FormData();

    const esMobiliario = form.descripcion2 === "Mobiliario";
    const gananciaToSend = esMobiliario ? 0 : form.ganancia;
    const ivaToSend = esMobiliario ? "No" : form.iva_aplicable;

    formData.append("idarticulo", form.idarticulo.toString());
    formData.append("nombre", form.nombre);
    formData.append("codigo_barras", form.codigo_barras);
    formData.append("descripcion", form.descripcion);
    formData.append("descripcion2", form.descripcion2);
    formData.append("estado", form.estado);
    // Stock siempre 0 en este módulo
    formData.append("stock", "0");
    formData.append("ganancia", String(gananciaToSend));
    formData.append("iva_aplicable", ivaToSend);
    formData.append("idunidad", String(form.idunidad));
    formData.append("idcategoria", String(form.idcategoria));

    if (file) {
      formData.append("imagen", file);
    }

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      const mensaje = isEditing
        ? "Artículo actualizado correctamente"
        : "Artículo creado correctamente";
      setAlert({
        type: "success",
        message: mensaje,
      });

      await fetchArticulos();
      setIsDialogOpen(false);
      resetForm();

      // Si es un alta nueva, preguntar por vincular proveedor
      if (!isEditing && data.idarticulo) {
        setLinkingArticleId(Number(data.idarticulo));
        setSelectedProveedorId(null);
        setProveedorSearch("");
        setProvStep(1);
        setProvForm({
          idproveedor: 0,
          nombre: "",
          RFC: "",
          codigo_postal: "",
          calle: "",
          localidad: "",
          municipio: "",
          telefono: "",
          correo: "",
          estado: "Activo",
          nombre_vendedor: "",
          telefono_vendedor: "",
          correo_vendedor: "",
        });
        await fetchProveedores();
        setLinkTab("existente");
        setIsLinkDialogOpen(true);
      }
    } else {
      setAlert({
        type: "error",
        message: data.error || "Error al guardar",
      });
    }

    setTimeout(() => setAlert(null), 3000);
  };

  const handleEdit = async (idarticulo: number) => {
    const response = await fetch(
      `${API_BASE}/api/articulos.php?action=get&idarticulo=${idarticulo}`
    );
    const data = await response.json();
    if (data.success) {
      const a: Articulo = data.articulo;
      setForm({
        idarticulo: a.idarticulo,
        nombre: a.nombre,
        codigo_barras: a.codigo_barras ?? "",
        descripcion: a.descripcion ?? "",
        descripcion2: a.descripcion2 ?? "Mobiliario",
        estado: a.estado ?? "Activo",
        img: a.img ?? "",
        ganancia: a.ganancia ?? 0,
        iva_aplicable: (a.iva_aplicable || "Si") as "Si" | "No",
        idunidad: a.idunidad ?? 0,
        idcategoria: a.idcategoria ?? 0,
      });
      setFile(null);
      setIsEditing(true);
      setIsDialogOpen(true);
    } else {
      setAlert({
        type: "error",
        message: data.error || "Artículo no encontrado",
      });
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
      ganancia: 0,
      iva_aplicable: "Si",
      idunidad: 0,
      idcategoria: 0,
    });
    setFile(null);
    setIsEditing(false);
    setSearchCategoria("");
    setSearchUnidad("");
  };

  const unidadLabel = (a: Articulo) =>
    a.unidad_clave && a.unidad_descripcion
      ? `${a.unidad_clave} - ${a.unidad_descripcion}`
      : "-";

  const renderTabla = (rows: Articulo[]) => (
    <Table className="rounded-lg shadow-sm">
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Unidad</TableHead>
          <TableHead>Código</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Imagen</TableHead>
          <TableHead>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((art) => (
          <TableRow key={art.idarticulo}>
            <TableCell>{art.idarticulo}</TableCell>
            <TableCell>{art.nombre}</TableCell>
            <TableCell>{art.categoria_nombre}</TableCell>
            <TableCell>{unidadLabel(art)}</TableCell>
            <TableCell>{art.codigo_barras}</TableCell>
            <TableCell>{art.estado}</TableCell>
            <TableCell>{art.stock}</TableCell>
            <TableCell>
              {art.img ? (
                <img
                  src={`${API_BASE}/${art.img}`}
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

        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-gray-500 py-6">
              No hay artículos para mostrar
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  // Helpers para mostrar etiquetas actuales en los combos
  const categoriaSeleccionada = categorias.find(
    (c) => c.idcategoria === form.idcategoria
  );
  const unidadSeleccionada = unidades.find((u) => u.idunidad === form.idunidad);

  // Proveedores filtrados para el buscador del modal de vínculo
  const proveedoresFiltrados = proveedores.filter((p) => {
    if (!proveedorSearch.trim()) return true;
    const term = proveedorSearch.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(term) ||
      p.RFC.toLowerCase().includes(term) ||
      (p.nombre_vendedor || "").toLowerCase().includes(term)
    );
  });

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

      {/* Botón global para crear/editar */}
      <div className="flex justify-end mb-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    onValueChange={(value) =>
                      setForm({ ...form, estado: value })
                    }
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
              </div>

              {/* Ganancia / IVA solo si es Venta */}
              {form.descripcion2 === "Venta" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Ganancia (en $)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.ganancia}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          ganancia: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>IVA aplicable</Label>
                    <Select
                      value={form.iva_aplicable}
                      onValueChange={(value) =>
                        setForm({
                          ...form,
                          iva_aplicable: value as "Si" | "No",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar IVA" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Si">Sí</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Categoría con Command (buscable) */}
              <div ref={categoriaRef} className="relative">
                <Label>Categoría</Label>
                <div
                  className="flex items-center justify-between border rounded-lg px-3 py-2 cursor-text hover:border-gray-400 transition"
                  onClick={() => setIsCategoriaOpen(true)}
                >
                  <input
                    type="text"
                    placeholder="Seleccionar categoría..."
                    value={
                      isCategoriaOpen
                        ? searchCategoria
                        : categoriaSeleccionada?.nombre || ""
                    }
                    onFocus={() => setIsCategoriaOpen(true)}
                    onChange={(e) => {
                      setSearchCategoria(e.target.value);
                      setIsCategoriaOpen(true);
                    }}
                    className="w-full outline-none bg-transparent text-sm"
                  />
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>

                {isCategoriaOpen && (
                  <div className="absolute z-50 mt-1 w-full border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto bg-white">
                    <Command>
                      <CommandList>
                        {categorias.filter((c) => {
                          const term = searchCategoria.toLowerCase();
                          if (!term) return true;
                          return c.nombre.toLowerCase().includes(term);
                        }).length > 0 ? (
                          categorias
                            .filter((c) => {
                              const term = searchCategoria.toLowerCase();
                              if (!term) return true;
                              return c.nombre.toLowerCase().includes(term);
                            })
                            .map((c) => (
                              <CommandItem
                                key={c.idcategoria}
                                onSelect={() => {
                                  setForm({
                                    ...form,
                                    idcategoria: c.idcategoria,
                                  });
                                  setSearchCategoria("");
                                  setIsCategoriaOpen(false);
                                }}
                                className="cursor-pointer hover:bg-accent px-3 py-2"
                              >
                                {c.nombre}
                              </CommandItem>
                            ))
                        ) : (
                          <CommandEmpty className="px-3 py-2 text-gray-500">
                            No se encontraron categorías.
                          </CommandEmpty>
                        )}
                      </CommandList>
                    </Command>
                  </div>
                )}
              </div>

              {/* Unidad de medida con Command (buscable) */}
              <div ref={unidadRef} className="relative">
                <Label>Unidad de medida</Label>
                <div
                  className="flex items-center justify-between border rounded-lg px-3 py-2 cursor-text hover:border-gray-400 transition"
                  onClick={() => setIsUnidadOpen(true)}
                >
                  <input
                    type="text"
                    placeholder="Seleccionar unidad..."
                    value={
                      isUnidadOpen
                        ? searchUnidad
                        : unidadSeleccionada
                        ? `${unidadSeleccionada.clave} - ${unidadSeleccionada.descripcion}`
                        : ""
                    }
                    onFocus={() => setIsUnidadOpen(true)}
                    onChange={(e) => {
                      setSearchUnidad(e.target.value);
                      setIsUnidadOpen(true);
                    }}
                    className="w-full outline-none bg-transparent text-sm"
                  />
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>

                {isUnidadOpen && (
                  <div className="absolute z-50 mt-1 w-full border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto bg-white">
                    <Command>
                      <CommandList>
                        {unidades.filter((u) => {
                          const term = searchUnidad.toLowerCase();
                          if (!term) return true;
                          return (
                            u.clave.toLowerCase().includes(term) ||
                            u.descripcion.toLowerCase().includes(term)
                          );
                        }).length > 0 ? (
                          unidades
                            .filter((u) => {
                              const term = searchUnidad.toLowerCase();
                              if (!term) return true;
                              return (
                                u.clave.toLowerCase().includes(term) ||
                                u.descripcion.toLowerCase().includes(term)
                              );
                            })
                            .map((u) => (
                              <CommandItem
                                key={u.idunidad}
                                onSelect={() => {
                                  setForm({
                                    ...form,
                                    idunidad: u.idunidad,
                                  });
                                  setSearchUnidad("");
                                  setIsUnidadOpen(false);
                                }}
                                className="cursor-pointer hover:bg-accent px-3 py-2"
                              >
                                {u.clave} - {u.descripcion}
                              </CommandItem>
                            ))
                        ) : (
                          <CommandEmpty className="px-3 py-2 text-gray-500">
                            No se encontraron unidades.
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
                className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg w-full"
              >
                {isEditing ? "Actualizar" : "Crear"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs para Mobiliario / Venta */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "Mobiliario" | "Venta")}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="Mobiliario">Mobiliario</TabsTrigger>
          <TabsTrigger value="Venta">Artículos de Venta</TabsTrigger>
        </TabsList>

        {/* TAB MOBILIARIO */}
        <TabsContent value="Mobiliario">
          <div className="flex justify-between mb-4">
            <Input
              placeholder="Buscar mobiliario..."
              value={searchMobiliario}
              onChange={(e) => setSearchMobiliario(e.target.value)}
              className="max-w-sm rounded-lg shadow-md"
            />
          </div>

          {renderTabla(mobiliarioPageSlice)}

          <div className="flex justify-between mt-4">
            <Button
              disabled={pageMobiliario === 1}
              onClick={() => setPageMobiliario(pageMobiliario - 1)}
              className="bg-gray-800 hover:bg-gray-600 text-white font-medium"
            >
              Anterior
            </Button>
            <span>
              Página {pageMobiliario} de {totalPagesMobiliario}
            </span>
            <Button
              disabled={
                pageMobiliario === totalPagesMobiliario ||
                totalPagesMobiliario === 0
              }
              onClick={() => setPageMobiliario(pageMobiliario + 1)}
              className="bg-gray-800 hover:bg-gray-600 text-white font-medium"
            >
              Siguiente
            </Button>
          </div>
        </TabsContent>

        {/* TAB VENTA */}
        <TabsContent value="Venta">
          <div className="flex justify-between mb-4">
            <Input
              placeholder="Buscar artículos de venta..."
              value={searchVenta}
              onChange={(e) => setSearchVenta(e.target.value)}
              className="max-w-sm rounded-lg shadow-md"
            />
          </div>

          {renderTabla(ventaPageSlice)}

          <div className="flex justify-between mt-4">
            <Button
              disabled={pageVenta === 1}
              onClick={() => setPageVenta(pageVenta - 1)}
              className="bg-gray-800 hover:bg-gray-600 text-white font-medium"
            >
              Anterior
            </Button>
            <span>
              Página {pageVenta} de {totalPagesVenta}
            </span>
            <Button
              disabled={pageVenta === totalPagesVenta || totalPagesVenta === 0}
              onClick={() => setPageVenta(pageVenta + 1)}
              className="bg-gray-800 hover:bg-gray-600 text-white font-medium"
            >
              Siguiente
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL: VINCULAR PROVEEDOR */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vincular proveedor al artículo</DialogTitle>
          </DialogHeader>

          {!linkingArticleId ? (
            <p className="text-sm text-gray-600">
              No hay artículo seleccionado para vincular.
            </p>
          ) : (
            <Tabs
              value={linkTab}
              onValueChange={(val) => setLinkTab(val as "existente" | "nuevo")}
              className="mt-2"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="existente">Vincular existente</TabsTrigger>
                <TabsTrigger value="nuevo">Agregar nuevo proveedor</TabsTrigger>
              </TabsList>

              {/* TAB: PROVEEDOR EXISTENTE */}
              <TabsContent value="existente">
                <div className="border rounded-xl p-3 bg-background">
                  <h3 className="font-semibold mb-2 text-sm">
                    Proveedores existentes
                  </h3>
                  <Input
                    placeholder="Buscar por nombre, RFC o vendedor..."
                    value={proveedorSearch}
                    onChange={(e) => setProveedorSearch(e.target.value)}
                    className="mb-3"
                  />
                  <div className="max-h-64 overflow-y-auto border rounded-lg bg-accent contenedor1">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Proveedor</TableHead>
                          <TableHead>RFC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {proveedoresFiltrados.map((p) => (
                          <TableRow
                            key={p.idproveedor}
                            className={`cursor-pointer ${
                              selectedProveedorId === p.idproveedor
                                ? "bg-sidebar-border"
                                : ""
                            }`}
                            onClick={() =>
                              setSelectedProveedorId(p.idproveedor)
                            }
                          >
                            <TableCell className="text-sm">
                              <div className="font-medium">{p.nombre}</div>
                              <div className="text-xs text-gray-500">
                                {p.nombre_vendedor} · {p.telefono_vendedor}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">{p.RFC}</TableCell>
                          </TableRow>
                        ))}
                        {proveedoresFiltrados.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={2}
                              className="text-center text-gray-500 text-sm py-4"
                            >
                              No se encontraron proveedores.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <Button
                    className="mt-3 w-full bg-gray-800 text-white hover:bg-gray-700"
                    onClick={handleLinkProveedor}
                  >
                    Vincular proveedor seleccionado
                  </Button>
                </div>
              </TabsContent>

              {/* TAB: NUEVO PROVEEDOR (WIZARD) */}
              <TabsContent value="nuevo">
                <div className="border rounded-xl p-3 bg-accent">
                  <h3 className="font-semibold mb-3 text-sm">
                    Agregar nuevo proveedor
                  </h3>

                  {/* WIZARD DE 2 PASOS */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                          provStep === 1
                            ? "bg-gray-300 text-gray-700"
                            : "bg-gray-800 text-white"
                        }`}
                      >
                        1
                      </div>
                      <span className="text-xs font-medium">
                        Datos de la empresa
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-gray-300 mx-2" />
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                          provStep === 2
                            ? "bg-gray-300 text-gray-700"
                            : "bg-gray-800 text-white"
                        }`}
                      >
                        2
                      </div>
                      <span className="text-xs font-medium">
                        Datos del proveedor
                      </span>
                    </div>
                  </div>

                  <form
                    onSubmit={handleCreateProveedorFromWizard}
                    className="space-y-3"
                  >
                    {provStep === 1 && (
                      <div className="space-y-2 text-xs">
                        <div>
                          <Label>Nombre de la empresa</Label>
                          <Input
                            value={provForm.nombre}
                            onChange={(e) =>
                              setProvForm({
                                ...provForm,
                                nombre: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label>RFC</Label>
                          <Input
                            value={provForm.RFC}
                            onChange={(e) =>
                              setProvForm({
                                ...provForm,
                                RFC: e.target.value.toUpperCase(),
                              })
                            }
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Código Postal</Label>
                            <Input
                              value={provForm.codigo_postal}
                              onChange={(e) =>
                                setProvForm({
                                  ...provForm,
                                  codigo_postal: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>Teléfono empresa</Label>
                            <Input
                              value={provForm.telefono}
                              onChange={(e) =>
                                setProvForm({
                                  ...provForm,
                                  telefono: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Correo empresa</Label>
                          <Input
                            type="email"
                            value={provForm.correo}
                            onChange={(e) =>
                              setProvForm({
                                ...provForm,
                                correo: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label>Calle</Label>
                          <Input
                            value={provForm.calle}
                            onChange={(e) =>
                              setProvForm({
                                ...provForm,
                                calle: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Localidad / Colonia</Label>
                            <Input
                              value={provForm.localidad}
                              onChange={(e) =>
                                setProvForm({
                                  ...provForm,
                                  localidad: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label>Municipio / Ciudad</Label>
                            <Input
                              value={provForm.municipio}
                              onChange={(e) =>
                                setProvForm({
                                  ...provForm,
                                  municipio: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                        </div>
                        <div className="flex justify-end pt-1">
                          <Button
                            type="button"
                            size="sm"
                            className="bg-gray-800 text-white hover:bg-gray-700"
                            onClick={() => setProvStep(2)}
                          >
                            Siguiente
                          </Button>
                        </div>
                      </div>
                    )}

                    {provStep === 2 && (
                      <div className="space-y-2 text-xs">
                        <div>
                          <Label>Nombre del vendedor</Label>
                          <Input
                            value={provForm.nombre_vendedor}
                            onChange={(e) =>
                              setProvForm({
                                ...provForm,
                                nombre_vendedor: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label>Teléfono del vendedor</Label>
                          <Input
                            value={provForm.telefono_vendedor}
                            onChange={(e) =>
                              setProvForm({
                                ...provForm,
                                telefono_vendedor: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label>Correo del vendedor</Label>
                          <Input
                            type="email"
                            value={provForm.correo_vendedor}
                            onChange={(e) =>
                              setProvForm({
                                ...provForm,
                                correo_vendedor: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="flex justify-between gap-2 pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setProvStep(1)}
                          >
                            Atrás
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-gray-800 text-white hover:bg-gray-700"
                          >
                            Crear y vincular
                          </Button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArticulosDashboard;
