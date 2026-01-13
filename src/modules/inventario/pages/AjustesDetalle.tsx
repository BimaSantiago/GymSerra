import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Trash2, ChevronDown } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Command,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

interface Articulo {
  idarticulo: number;
  nombre: string;
  stock: number;
}

interface Detalle {
  tempId: number;
  iddetalle?: number;
  idarticulo: number;
  articulo: string;
  conteo: number;
  diferencia: number;
}

interface AjusteInfo {
  idajuste: number;
  comentario: string;
  fecha: string;
  tipo: "entrada" | "salida" | string;
}

interface ApiDetalleResponse {
  success?: boolean;
  info?: AjusteInfo;
  detalles?: {
    iddetalle: number;
    idarticulo: number;
    articulo: string;
    conteo: number;
    diferencia: number;
  }[];
  error?: string;
}

interface ApiSaveResponse {
  success?: boolean;
  idajuste?: number;
  error?: string;
}

const AjustesDetalle: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialTipo = (searchParams.get("tipo") as "entrada" | "salida") || "";
  const initialId = Number(searchParams.get("idajuste")) || null;

  const [tipo, setTipo] = useState<"entrada" | "salida" | "">(initialTipo);
  const [idajuste, setIdajuste] = useState<number | null>(initialId);
  const [comentario, setComentario] = useState("");

  const [info, setInfo] = useState<AjusteInfo | null>(null);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [form, setForm] = useState({
    idarticulo: "",
    conteo: "",
    diferencia: "",
  });

  // 🔒 Bloqueo de edición (solo lectura cuando viene de BD o ya se guardó)
  const [isLocked, setIsLocked] = useState<boolean>(!!initialId);
  const [tempIdCounter, setTempIdCounter] = useState(1);

  // 🔎 Command de artículos
  const [articuloSearch, setArticuloSearch] = useState("");
  const [isArticuloOpen, setIsArticuloOpen] = useState(false);
  const articuloRef = useRef<HTMLDivElement | null>(null);

  const selectedArticulo = articulos.find(
    (a) => String(a.idarticulo) === form.idarticulo
  );

  // Cerrar Command de artículos al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        articuloRef.current &&
        !articuloRef.current.contains(event.target as Node)
      ) {
        setIsArticuloOpen(false);
        setArticuloSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ============================================================
   *  CARGAR ARTÍCULOS
   * ============================================================ */
  const fetchArticulos = async (): Promise<void> => {
    try {
      const res = await fetch(
        "https://academiagymserra.garzas.store/api/articulos.php?action=list&page=1&limit=1000&search="
      );
      const data = await res.json();
      if (Array.isArray(data.articulos)) setArticulos(data.articulos);
    } catch {
      console.error("Error cargando artículos");
    }
  };

  /* ============================================================
   *  CARGAR DETALLE DE UN AJUSTE EXISTENTE
   * ============================================================ */
  const fetchAjusteExistente = async (): Promise<void> => {
    if (!initialId) return;
    try {
      const res = await fetch(
        `https://academiagymserra.garzas.store/api/ajustes.php?action=detalle&idajuste=${initialId}`
      );
      const data: ApiDetalleResponse = await res.json();
      if (data.success && data.info) {
        const info = data.info;
        const detallesApi = data.detalles ?? [];

        setInfo({
          ...info,
          tipo: (info.tipo || "").toLowerCase() as "entrada" | "salida",
        });

        setIdajuste(info.idajuste);
        setTipo((info.tipo || "").toLowerCase() as "entrada" | "salida");
        setComentario(info.comentario);

        const mapped: Detalle[] = detallesApi.map((d) => ({
          tempId: d.iddetalle,
          iddetalle: d.iddetalle,
          idarticulo: d.idarticulo,
          articulo: d.articulo,
          conteo: d.conteo,
          diferencia: d.diferencia,
        }));
        setDetalles(mapped);
        setIsLocked(true); // solo lectura
      } else if (data.error) {
        setAlert({ type: "error", message: data.error });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch {
      setAlert({
        type: "error",
        message: "Error al cargar el ajuste.",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  useEffect(() => {
    fetchArticulos();
    if (initialId) {
      void fetchAjusteExistente();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============================================================
   *  CALCULAR DIFERENCIA AUTOMÁTICAMENTE
   * ============================================================ */
  useEffect(() => {
    const selected = articulos.find(
      (a) => String(a.idarticulo) === form.idarticulo
    );
    if (selected) {
      const stockActual = selected.stock;
      const conteo = Number(form.conteo) || 0;
      const diferencia = conteo - stockActual;
      setForm((prev) => ({ ...prev, diferencia: String(diferencia) }));
    } else {
      setForm((prev) => ({ ...prev, diferencia: "" }));
    }
  }, [form.conteo, form.idarticulo, articulos]);

  /* ============================================================
   *  AGREGAR DETALLE (sin repetir artículo)
   * ============================================================ */
  const handleAddDetalle = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (isLocked) return;

    if (!form.idarticulo || !form.conteo) {
      setAlert({
        type: "error",
        message: "Selecciona un artículo y completa el conteo.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    const art = articulos.find((a) => String(a.idarticulo) === form.idarticulo);
    if (!art) {
      setAlert({
        type: "error",
        message: "Artículo no encontrado.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    // 🚫 No permitir artículos repetidos en el ajuste
    const yaExiste = detalles.some((d) => d.idarticulo === art.idarticulo);
    if (yaExiste) {
      setAlert({
        type: "error",
        message: "Este artículo ya está agregado al ajuste.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    const conteoNum = Number(form.conteo) || 0;
    const diferenciaNum = Number(form.diferencia) || 0;

    const nuevo: Detalle = {
      tempId: tempIdCounter,
      iddetalle: undefined,
      idarticulo: art.idarticulo,
      articulo: art.nombre,
      conteo: conteoNum,
      diferencia: diferenciaNum,
    };

    setDetalles((prev) => [...prev, nuevo]);
    setTempIdCounter((prev) => prev + 1);
    setForm({ idarticulo: "", conteo: "", diferencia: "" });
    setArticuloSearch("");
    setIsArticuloOpen(false);
  };

  const handleDeleteDetalle = (tempId: number): void => {
    if (isLocked) return;
    setDetalles((prev) => prev.filter((d) => d.tempId !== tempId));
  };

  /* ============================================================
   *  GUARDAR AJUSTE (movimiento + detalles)
   * ============================================================ */
  const handleGuardarAjuste = async (): Promise<void> => {
    if (isLocked) return;

    if (!tipo || !comentario) {
      setAlert({
        type: "error",
        message: "Selecciona el tipo de ajuste y escribe una justificación.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    if (detalles.length === 0) {
      setAlert({
        type: "error",
        message: "Agrega al menos un artículo al ajuste.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    const body = {
      tipo,
      comentario,
      detalles: detalles.map((d) => ({
        idarticulo: d.idarticulo,
        conteo: d.conteo,
        diferencia: d.diferencia,
      })),
    };

    try {
      const res = await fetch(
        "https://academiagymserra.garzas.store/api/ajustes.php?action=save",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data: ApiSaveResponse = await res.json();

      if (data.success && data.idajuste) {
        setIdajuste(data.idajuste);
        setIsLocked(true); // 🔒 bloqueamos y desaparece el formulario
        setAlert({
          type: "success",
          message: "Ajuste guardado correctamente.",
        });
      } else {
        setAlert({
          type: "error",
          message: data.error ?? "Error al guardar el ajuste.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Error de conexión con el servidor.",
      });
    }

    setTimeout(() => setAlert(null), 3000);
  };

  const titulo =
    idajuste && tipo
      ? `${tipo === "entrada" ? "Ajuste de Entrada" : "Ajuste de Salida"} #${
          idajuste ?? ""
        }`
      : "Crear nuevo ajuste";

  // Artículos filtrados por búsqueda
  const articulosFiltrados = articulos.filter((a) => {
    if (!articuloSearch.trim()) return true;
    const term = articuloSearch.toLowerCase();
    return a.nombre.toLowerCase().includes(term);
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold text-primary/80">{titulo}</h1>
        <Button
          onClick={() => navigate("/dashboard/ajustes")}
          variant="outline"
        >
          Volver
        </Button>
      </div>

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
          <AlertTitle>
            {alert.type === "success" ? "Éxito" : "Error"}
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* Info del ajuste si viene de BD */}
      {info && (
        <div className="mb-6 bg-card rounded-lg p-4 shadow-sm">
          <p>
            <strong>Fecha:</strong> {info.fecha}
          </p>
          <p>
            <strong>Comentario:</strong> {info.comentario}
          </p>
        </div>
      )}

      {/* ========================= ENCABEZADO / DATOS GENERALES ========================= */}
      <div className="bg-card p-6 rounded-xl shadow-lg mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tipo de ajuste</Label>
            <Select
              value={tipo}
              onValueChange={(v) => setTipo(v as "entrada" | "salida")}
              disabled={isLocked}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">
                  Entrada (incrementa/ajusta stock)
                </SelectItem>
                <SelectItem value="salida">
                  Salida (reduce/ajusta stock)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Justificación</Label>
            <Input
              placeholder="Ej. Reposición, daño, pérdida, ajuste físico..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              disabled={isLocked}
            />
          </div>
        </div>
      </div>

      {/* ========================= DETALLES DEL AJUSTE ========================= */}
      {!isLocked && (
        <form
          onSubmit={handleAddDetalle}
          className="space-y-6 bg-card p-6 rounded-xl shadow-lg mb-6"
        >
          <h3 className="font-semibold text-lg mb-2">Artículos del ajuste</h3>

          <div className="grid grid-cols-3 gap-4">
            {/* 🔎 Command de artículos */}
            <div className="relative" ref={articuloRef}>
              <Label>Artículo</Label>
              <div
                className="flex items-center justify-between border rounded-lg px-3 py-2 cursor-text hover:border-gray-400 transition"
                onClick={() => {
                  if (!isLocked) setIsArticuloOpen(true);
                }}
              >
                <input
                  type="text"
                  className="w-full outline-none bg-transparent text-sm"
                  placeholder="Buscar artículo..."
                  value={
                    isArticuloOpen
                      ? articuloSearch
                      : selectedArticulo
                      ? `${selectedArticulo.nombre} (Stock: ${selectedArticulo.stock})`
                      : ""
                  }
                  onFocus={() => {
                    if (!isLocked) setIsArticuloOpen(true);
                  }}
                  onChange={(e) => {
                    if (isLocked) return;
                    setArticuloSearch(e.target.value);
                    setIsArticuloOpen(true);
                  }}
                  disabled={isLocked}
                />
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </div>

              {isArticuloOpen && !isLocked && (
                <div className="absolute z-50 mt-1 w-full border border-gray-200 rounded-lg shadow-xl bg-card">
                  <Command className="max-h-60 overflow-y-auto">
                    <CommandList>
                      {articulosFiltrados.length > 0 ? (
                        articulosFiltrados.map((a) => (
                          <CommandItem
                            key={a.idarticulo}
                            onSelect={() => {
                              setForm({
                                ...form,
                                idarticulo: String(a.idarticulo),
                              });
                              setArticuloSearch("");
                              setIsArticuloOpen(false);
                            }}
                            className="cursor-pointer hover:bg-accent px-3 py-2 text-sm"
                          >
                            {a.nombre} (Stock: {a.stock})
                          </CommandItem>
                        ))
                      ) : (
                        <CommandEmpty className="px-3 py-2 text-gray-500">
                          No se encontraron artículos.
                        </CommandEmpty>
                      )}
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>

            <div>
              <Label>Conteo actual</Label>
              <Input
                type="number"
                value={form.conteo}
                onChange={(e) => setForm({ ...form, conteo: e.target.value })}
                disabled={isLocked}
              />
            </div>

            <div>
              <Label>Diferencia</Label>
              <Input type="number" value={form.diferencia} readOnly />
            </div>
          </div>

          <Button
            type="submit"
            className="bg-gray-800 text-white hover:bg-gray-700 w-full"
          >
            Agregar al ajuste
          </Button>
        </form>
      )}

      {/* Tabla de detalles */}
      <Table className="rounded-lg">
        <TableHeader>
          <TableRow>
            <TableHead>Artículo</TableHead>
            <TableHead>Conteo</TableHead>
            <TableHead>Diferencia</TableHead>
            {!isLocked && <TableHead>Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {detalles.length > 0 ? (
            detalles.map((d) => (
              <TableRow key={d.tempId}>
                <TableCell>{d.articulo}</TableCell>
                <TableCell>{d.conteo}</TableCell>
                <TableCell>{d.diferencia}</TableCell>
                {!isLocked && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDetalle(d.tempId)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-gray-500 py-4">
                No hay artículos en el ajuste.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Botón GUARDAR AJUSTE (solo al crear) */}
      {!isLocked && (
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleGuardarAjuste}
            className="bg-gray-900 text-white hover:bg-gray-800 px-8"
          >
            Guardar Ajuste
          </Button>
        </div>
      )}
    </div>
  );
};

export default AjustesDetalle;
