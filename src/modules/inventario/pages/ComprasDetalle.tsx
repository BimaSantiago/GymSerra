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
  Command,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

interface Proveedor {
  idproveedor: number;
  nombre: string;
}

interface Articulo {
  idarticulo: number;
  nombre: string;
  stock?: number;
  ganancia?: number;
  iva_aplicable?: "Si" | "No";
}

interface Detalle {
  tempId: number;
  iddetalle_compra?: number;
  idarticulo: number;
  articulo: string;
  cantidad: number;
  precioCosto?: number | null;
  precioVenta?: number | null;
  subtotal?: number;
}

interface CompraInfo {
  idcompra: number;
  proveedor: string;
  fecha: string;
  total: number;
}

interface ApiDetalleResponse {
  success?: boolean;
  info?: CompraInfo;
  detalles?: {
    iddetalle_compra: number;
    idarticulo: number;
    articulo: string;
    cantidad: number;
    subtotal: number;
    costo: number | null;
    precio: number | null;
  }[];
  error?: string;
}

interface ApiSaveResponse {
  success?: boolean;
  idcompra?: number;
  error?: string;
}

const IVA_RATE = 0.16; // IVA 16%

const ComprasDetalle: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialId = Number(searchParams.get("idcompra")) || null;

  const [idcompra, setIdcompra] = useState<number | null>(initialId);
  const [info, setInfo] = useState<CompraInfo | null>(null);

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [idProveedor, setIdProveedor] = useState<string>("");

  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [form, setForm] = useState({
    idarticulo: "",
    cantidad: "",
    precioCosto: "",
    precioVenta: "",
  });

  const [isLocked, setIsLocked] = useState<boolean>(!!initialId);
  const [tempIdCounter, setTempIdCounter] = useState(1);

  // Command de artículos
  const [articuloSearch, setArticuloSearch] = useState("");
  const [isArticuloOpen, setIsArticuloOpen] = useState(false);
  const articuloRef = useRef<HTMLDivElement | null>(null);

  // Command de proveedores
  const [proveedorSearch, setProveedorSearch] = useState("");
  const [isProveedorOpen, setIsProveedorOpen] = useState(false);
  const proveedorRef = useRef<HTMLDivElement | null>(null);

  const selectedArticulo = articulos.find(
    (a) => String(a.idarticulo) === form.idarticulo
  );

  // Cerrar commands al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        articuloRef.current &&
        !articuloRef.current.contains(event.target as Node)
      ) {
        setIsArticuloOpen(false);
        setArticuloSearch("");
      }
      if (
        proveedorRef.current &&
        !proveedorRef.current.contains(event.target as Node)
      ) {
        setIsProveedorOpen(false);
        setProveedorSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ===================== CARGAR PROVEEDORES / ARTÍCULOS / COMPRA ===================== */

  const fetchProveedores = async (): Promise<void> => {
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/proveedores.php?action=list"
      );
      const data = await res.json();
      if (Array.isArray(data.proveedores)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: Proveedor[] = data.proveedores.map((p: any) => ({
          idproveedor: p.idproveedor ?? p.idprovedor,
          nombre: p.nombre,
        }));
        setProveedores(mapped);
      }
    } catch {
      console.error("Error al cargar proveedores");
    }
  };

  const fetchArticulos = async (): Promise<void> => {
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/articulos.php?action=list&page=1&limit=1000&search="
      );
      const data = await res.json();
      if (Array.isArray(data.articulos)) setArticulos(data.articulos);
    } catch {
      console.error("Error cargando artículos");
    }
  };

  const fetchCompraExistente = async (): Promise<void> => {
    if (!initialId) return;
    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/compras.php?action=detalle&idcompra=${initialId}`
      );
      const data: ApiDetalleResponse = await res.json();
      if (data.success && data.info) {
        setInfo(data.info);
        setIdcompra(data.info.idcompra);

        const mapped: Detalle[] =
          data.detalles?.map((d) => ({
            tempId: d.iddetalle_compra,
            iddetalle_compra: d.iddetalle_compra,
            idarticulo: d.idarticulo,
            articulo: d.articulo,
            cantidad: d.cantidad,
            precioCosto: d.costo,
            precioVenta: d.precio,
            subtotal: d.subtotal,
          })) ?? [];

        setDetalles(mapped);
        setIsLocked(true);
      } else if (data.error) {
        setAlert({ type: "error", message: data.error });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch {
      setAlert({
        type: "error",
        message: "Error al cargar la compra.",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  useEffect(() => {
    void fetchProveedores();
    void fetchArticulos();
    if (initialId) {
      void fetchCompraExistente();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===================== AGREGAR DETALLE (en memoria) ===================== */

  const handleAddDetalle = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (isLocked) return;

    if (!form.idarticulo || !form.cantidad) {
      setAlert({
        type: "error",
        message: "Selecciona un artículo y captura la cantidad.",
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

    // Evitar repetir el mismo artículo
    const yaExiste = detalles.some((d) => d.idarticulo === art.idarticulo);
    if (yaExiste) {
      setAlert({
        type: "error",
        message: "Este artículo ya está agregado a la compra.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    const cantidadNum = Number(form.cantidad) || 0;
    const costoNum =
      form.precioCosto.trim() === "" ? null : Number(form.precioCosto);
    const ventaNum =
      form.precioVenta.trim() === "" ? null : Number(form.precioVenta);

    const base =
      costoNum && costoNum > 0
        ? costoNum
        : ventaNum && ventaNum > 0
        ? ventaNum
        : 0;

    const subtotal = base > 0 ? cantidadNum * base : undefined;

    const nuevo: Detalle = {
      tempId: tempIdCounter,
      idarticulo: art.idarticulo,
      articulo: art.nombre,
      cantidad: cantidadNum,
      precioCosto: costoNum && costoNum > 0 ? costoNum : null,
      precioVenta: ventaNum && ventaNum > 0 ? ventaNum : null,
      subtotal,
    };

    setDetalles((prev) => [...prev, nuevo]);
    setTempIdCounter((prev) => prev + 1);
    setForm({
      idarticulo: "",
      cantidad: "",
      precioCosto: "",
      precioVenta: "",
    });
    setArticuloSearch("");
    setIsArticuloOpen(false);
  };

  const handleDeleteDetalle = (tempId: number): void => {
    if (isLocked) return;
    setDetalles((prev) => prev.filter((d) => d.tempId !== tempId));
  };

  /* ===================== GUARDAR COMPRA (único POST) ===================== */

  const handleGuardarCompra = async (): Promise<void> => {
    if (isLocked) return;

    if (!idProveedor) {
      setAlert({
        type: "error",
        message: "Selecciona un proveedor para la compra.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    if (detalles.length === 0) {
      setAlert({
        type: "error",
        message: "Agrega al menos un artículo a la compra.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    const detallesPayload = detalles.map((d) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const det: any = {
        idarticulo: d.idarticulo,
        cantidad: d.cantidad,
      };
      if (d.precioCosto !== null && d.precioCosto !== undefined) {
        det.precioCosto = d.precioCosto;
      }
      if (d.precioVenta !== null && d.precioVenta !== undefined) {
        det.precioVenta = d.precioVenta;
      }
      return det;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = {
      idproveedor: Number(idProveedor),
      detalles: detallesPayload,
    };

    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/compras.php?action=save",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data: ApiSaveResponse = await res.json();

      if (data.success && data.idcompra) {
        setIdcompra(data.idcompra);
        setIsLocked(true);
        setAlert({
          type: "success",
          message: "Compra guardada correctamente.",
        });
        navigate(`/dashboard/comprasDetalle?idcompra=${data.idcompra}`);
      } else {
        setAlert({
          type: "error",
          message: data.error ?? "Error al guardar la compra.",
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

  /* ===================== CÁLCULOS: PRECIO RECOMENDADO + PRECIO FINAL ===================== */

  // Precio recomendado para el input de precioVenta (formulario)
  const calcularPrecioRecomendadoForm = (): number | null => {
    if (!selectedArticulo) return null;

    const costo = Number(form.precioCosto || 0);
    if (!costo || costo <= 0) return null;

    const ganancia = Number(selectedArticulo.ganancia ?? 0);
    const aplicaIVA = selectedArticulo.iva_aplicable === "Si";

    let precio = costo * (1 + ganancia / 100);
    if (aplicaIVA) {
      precio = precio * (1 + IVA_RATE);
    }

    return Number(precio.toFixed(2));
  };

  const calcularPrecioFinal = (detalle: Detalle): number | null => {
    const art = articulos.find((a) => a.idarticulo === detalle.idarticulo);
    if (!art) return null;

    const ganancia = Number(art.ganancia ?? 0);
    const aplicaIVA = art.iva_aplicable === "Si";

    const base =
      detalle.precioCosto != null
        ? detalle.precioCosto
        : detalle.precioVenta != null
        ? detalle.precioVenta
        : 0;

    if (!base || base <= 0) return null;

    const conGanancia = base * (1 + ganancia / 100);
    const final = aplicaIVA ? conGanancia * (1 + IVA_RATE) : conGanancia;

    return Number(final.toFixed(2));
  };

  /* ===================== DERIVADOS ===================== */

  const titulo = idcompra ? `Compra #${idcompra}` : "Crear nueva compra";

  const articulosFiltrados = articulos.filter((a) => {
    if (!articuloSearch.trim()) return true;
    const term = articuloSearch.toLowerCase();
    return a.nombre.toLowerCase().includes(term);
  });

  const proveedoresFiltrados = proveedores.filter((p) => {
    if (!proveedorSearch.trim()) return true;
    const term = proveedorSearch.toLowerCase();
    return p.nombre.toLowerCase().includes(term);
  });

  const proveedorNombre =
    info?.proveedor ||
    proveedores.find((p) => String(p.idproveedor) === idProveedor)?.nombre ||
    "";

  const precioRecomendadoForm = calcularPrecioRecomendadoForm();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">{titulo}</h2>
        <Button
          onClick={() => navigate("/dashboard/compras")}
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

      {/* Info de compra existente */}
      {info && (
        <div className="mb-6 bg-card rounded-lg p-4 shadow-sm">
          <p>
            <strong>Proveedor:</strong> {info.proveedor}
          </p>
          <p>
            <strong>Fecha:</strong> {info.fecha}
          </p>
          <p>
            <strong>Total:</strong> ${info.total}
          </p>
        </div>
      )}

      {/* ================== DATOS GENERALES DE LA COMPRA ================== */}
      <div className="bg-card p-6 rounded-xl shadow-lg mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Proveedor con Command */}
          <div className="relative" ref={proveedorRef}>
            <Label>Proveedor</Label>
            {idcompra && info ? (
              <Input value={info.proveedor} disabled />
            ) : (
              <>
                <div
                  className="flex items-center justify-between border rounded-lg px-3 py-2 cursor-text hover:border-gray-400 transition"
                  onClick={() => {
                    if (!isLocked) setIsProveedorOpen(true);
                  }}
                >
                  <input
                    type="text"
                    className="w-full outline-none bg-transparent text-sm"
                    placeholder="Buscar proveedor..."
                    value={
                      isProveedorOpen
                        ? proveedorSearch
                        : proveedores.find(
                            (p) => String(p.idproveedor) === idProveedor
                          )?.nombre ?? ""
                    }
                    onFocus={() => {
                      if (!isLocked) setIsProveedorOpen(true);
                    }}
                    onChange={(e) => {
                      if (isLocked) return;
                      setProveedorSearch(e.target.value);
                      setIsProveedorOpen(true);
                    }}
                    disabled={isLocked}
                  />
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>

                {isProveedorOpen && !isLocked && (
                  <div className="absolute z-50 mt-1 w-full border border-gray-200 rounded-lg shadow-xl bg-card">
                    <Command className="max-h-60 overflow-y-auto">
                      <CommandList>
                        {proveedoresFiltrados.length > 0 ? (
                          proveedoresFiltrados.map((p) => (
                            <CommandItem
                              key={p.idproveedor}
                              onSelect={() => {
                                setIdProveedor(String(p.idproveedor));
                                setProveedorSearch("");
                                setIsProveedorOpen(false);
                              }}
                              className="cursor-pointer hover:bg-accent px-3 py-2 text-sm"
                            >
                              {p.nombre}
                            </CommandItem>
                          ))
                        ) : (
                          <CommandEmpty className="px-3 py-2 text-gray-500">
                            No se encontraron proveedores.
                          </CommandEmpty>
                        )}
                      </CommandList>
                    </Command>
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <Label>Proveedor seleccionado</Label>
            <Input value={proveedorNombre} disabled />
          </div>
        </div>
      </div>

      {/* ================== DETALLE DE LA COMPRA ================== */}
      {!isLocked && (
        <form
          onSubmit={handleAddDetalle}
          className="space-y-6 bg-card p-6 rounded-xl shadow-lg mb-6"
        >
          <h3 className="font-semibold text-lg mb-2">Artículos de la compra</h3>

          <div className="grid grid-cols-4 gap-4">
            {/* Command de artículos */}
            <div className="relative col-span-2" ref={articuloRef}>
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
                      ? selectedArticulo.nombre
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
                              setForm((prev) => ({
                                ...prev,
                                idarticulo: String(a.idarticulo),
                              }));
                              setArticuloSearch("");
                              setIsArticuloOpen(false);
                            }}
                            className="cursor-pointer hover:bg-accent px-3 py-2 text-sm"
                          >
                            {a.nombre}
                            {typeof a.stock === "number" &&
                              ` (Stock: ${a.stock})`}
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
              <Label>Cantidad</Label>
              <Input
                type="number"
                value={form.cantidad}
                onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                disabled={isLocked}
              />
            </div>

            <div>
              <Label>Precio costo</Label>
              <Input
                type="number"
                step="0.01"
                value={form.precioCosto}
                onChange={(e) =>
                  setForm({ ...form, precioCosto: e.target.value })
                }
                disabled={isLocked}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2" />
            <div>
              <Label>Precio venta (opcional)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.precioVenta}
                required
                placeholder={
                  precioRecomendadoForm != null
                    ? precioRecomendadoForm.toString()
                    : ""
                }
                onChange={(e) =>
                  setForm({ ...form, precioVenta: e.target.value })
                }
                disabled={isLocked}
              />
              {precioRecomendadoForm != null && (
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                  <span>Precio recomendado: ${precioRecomendadoForm}</span>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        precioVenta: precioRecomendadoForm.toString(),
                      }))
                    }
                  >
                    Usar recomendado
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                className="bg-gray-800 text-white hover:bg-gray-700 w-full"
              >
                Agregar a la compra
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Tabla de detalles */}
      <Table className="rounded-lg bg-card shadow-lg">
        <TableHeader>
          <TableRow>
            <TableHead>Artículo</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Precio costo</TableHead>
            <TableHead>Precio venta</TableHead>
            <TableHead>Subtotal</TableHead>
            <TableHead>Precio final (IVA + ganancia)</TableHead>
            {!isLocked && <TableHead>Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {detalles.length > 0 ? (
            detalles.map((d) => {
              const precioFinal = calcularPrecioFinal(d);
              return (
                <TableRow key={d.tempId}>
                  <TableCell>{d.articulo}</TableCell>
                  <TableCell>{d.cantidad}</TableCell>
                  <TableCell>
                    {d.precioCosto != null ? `$${d.precioCosto}` : "-"}
                  </TableCell>
                  <TableCell>
                    {d.precioVenta != null ? `$${d.precioVenta}` : "-"}
                  </TableCell>
                  <TableCell>
                    {d.subtotal != null
                      ? `$${d.subtotal}`
                      : d.precioCosto != null
                      ? `$${d.cantidad * d.precioCosto}`
                      : d.precioVenta != null
                      ? `$${d.cantidad * d.precioVenta}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {precioFinal != null ? `$${precioFinal}` : "-"}
                  </TableCell>
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
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={isLocked ? 6 : 7}
                className="text-center text-gray-500 py-4"
              >
                No hay artículos en la compra.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Botón GUARDAR COMPRA */}
      {!isLocked && (
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleGuardarCompra}
            className="bg-gray-900 text-white hover:bg-gray-800 px-8"
          >
            Guardar Compra
          </Button>
        </div>
      )}
    </div>
  );
};

export default ComprasDetalle;
