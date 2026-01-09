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
import {
  Command,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CheckCircle2,
  AlertCircle,
  Trash2,
  ChevronDown,
  Save,
  ArrowLeft,
  Ban,
  RotateCcw,
  Plus,
} from "lucide-react";

const API_BASE = "http://localhost/GymSerra/public/api";

interface Articulo {
  idarticulo: number;
  nombre: string;
  stock?: number;
  descripcion2?: string;
  precio: number;
}

interface Cliente {
  idcliente: number;
  nombre: string;
}

interface DetalleVenta {
  iddetalle_venta?: number;
  idarticulo: number;
  articulo: string;
  cantidad: number;
  precio?: number;
  subtotal?: number;
  cantidad_devuelta?: number;
}

interface VentaInfo {
  idventa: number;
  fecha: string;
  total: number;
  idcliente?: number | null;
  cliente?: string | null;
  cancelada?: boolean | 0 | 1;
}

interface DevolucionHistorial {
  iddevolucion_detalle: number;
  fecha_devolucion: string;
  articulo: string;
  cantidad_devuelta: number;
  subtotal: number;
  motivo: string;
}

interface Motivo {
  idmotivo: number;
  nombre: string;
  tipo: string;
}

interface DevolucionItem {
  iddetalle_venta: number;
  idarticulo: number;
  articulo: string;
  cantidadMaxima: number;
  cantidadDevolver: number;
  precio: number;
}

interface ApiDetalleResponse {
  success?: boolean;
  info?: VentaInfo;
  detalles?: DetalleVenta[];
  devoluciones?: DevolucionHistorial[];
  error?: string;
}

interface ApiGenericResponse {
  success?: boolean;
  idventa?: number;
  error?: string;
}

const VentasDetalle: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const idventaParam = searchParams.get("idventa");
  const isEditing = !!idventaParam;
  const idventa = idventaParam ? Number(idventaParam) : null;

  const [info, setInfo] = useState<VentaInfo | null>(null);
  const [detallesBackend, setDetallesBackend] = useState<DetalleVenta[]>([]);
  const [historialDevoluciones, setHistorialDevoluciones] = useState<
    DevolucionHistorial[]
  >([]);

  const [detallesLocal, setDetallesLocal] = useState<DetalleVenta[]>([]);

  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [formDetalle, setFormDetalle] = useState<{
    idarticulo: number;
    cantidad: string;
    precio: number;
    subtotal: number;
  }>({
    idarticulo: 0,
    cantidad: "",
    precio: 0,
    subtotal: 0,
  });

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [articuloSearch, setArticuloSearch] = useState("");
  const [isArticuloMenuOpen, setIsArticuloMenuOpen] = useState(false);
  const articuloMenuRef = useRef<HTMLDivElement | null>(null);
  const [selectedArticuloLabel, setSelectedArticuloLabel] = useState("");

  const [clienteSearch, setClienteSearch] = useState("");
  const [isClienteMenuOpen, setIsClienteMenuOpen] = useState(false);
  const clienteMenuRef = useRef<HTMLDivElement | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  const [motivosCancel, setMotivosCancel] = useState<Motivo[]>([]);
  const [motivosDevol, setMotivosDevol] = useState<Motivo[]>([]);
  const [selectedMotivoCancelId, setSelectedMotivoCancelId] =
    useState<string>("");
  const [selectedMotivoDevolId, setSelectedMotivoDevolId] =
    useState<string>("");
  const [nuevoMotivoCancel, setNuevoMotivoCancel] = useState("");
  const [nuevoMotivoDevol, setNuevoMotivoDevol] = useState("");
  const [showNuevoMotivoCancel, setShowNuevoMotivoCancel] = useState(false);
  const [showNuevoMotivoDevol, setShowNuevoMotivoDevol] = useState(false);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Modal de devoluciones múltiples
  const [devolMultipleDialogOpen, setDevolMultipleDialogOpen] = useState(false);
  const [devolucionesItems, setDevolucionesItems] = useState<DevolucionItem[]>(
    []
  );
  const [devolReason, setDevolReason] = useState("");

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
  };

  const isCancelada =
    info?.cancelada === true || info?.cancelada === 1 ? true : false;

  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 3500);
    return () => clearTimeout(t);
  }, [alert]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        articuloMenuRef.current &&
        !articuloMenuRef.current.contains(target)
      ) {
        setIsArticuloMenuOpen(false);
      }
      if (clienteMenuRef.current && !clienteMenuRef.current.contains(target)) {
        setIsClienteMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    void fetchArticulos();
    void fetchClientes();
    void fetchMotivos("Cancelacion");
    void fetchMotivos("Devolucion");
  }, []);

  const fetchArticulos = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/ventas.php?action=articulosVenta`);
      const data = await res.json();
      if (data.success && Array.isArray(data.articulos)) {
        const parsed: Articulo[] = data.articulos.map((a: any) => ({
          idarticulo: Number(a.idarticulo),
          nombre: a.nombre,
          stock: a.stock ?? 0,
          descripcion2: a.descripcion2,
          precio: Number(a.precio) || 0,
        }));
        setArticulos(parsed);
      } else {
        console.error("Error en articulosVenta:", data.error);
      }
    } catch (err) {
      console.error("Error al cargar artículos:", err);
    }
  };

  const fetchClientes = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/clientes.php?action=list`);
      const data = await res.json();
      if (Array.isArray(data.clientes)) {
        const parsed: Cliente[] = data.clientes.map((c: any) => ({
          idcliente: Number(c.idcliente),
          nombre: c.nombre ?? c.nombre_completo,
        }));
        setClientes(parsed);
      }
    } catch {
      console.error("Error al cargar clientes");
    }
  };

  const fetchMotivos = async (tipo: "Cancelacion" | "Devolucion") => {
    try {
      const res = await fetch(
        `${API_BASE}/ventas.php?action=listMotivos&tipo=${encodeURIComponent(
          tipo
        )}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.motivos)) {
        const parsed: Motivo[] = data.motivos.map((m: any) => ({
          idmotivo: Number(m.idmotivo),
          nombre: m.nombre,
          tipo: m.tipo,
        }));
        if (tipo === "Cancelacion") setMotivosCancel(parsed);
        else setMotivosDevol(parsed);
      }
    } catch {
      console.error("Error al cargar motivos", tipo);
    }
  };

  const createMotivo = async (
    tipo: "Cancelacion" | "Devolucion",
    nombre: string
  ): Promise<Motivo | null> => {
    try {
      const res = await fetch(`${API_BASE}/ventas.php?action=createMotivo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, nombre }),
      });
      const data = await res.json();
      if (data.success && data.motivo) {
        const m: Motivo = {
          idmotivo: Number(data.motivo.idmotivo),
          nombre: data.motivo.nombre,
          tipo: data.motivo.tipo,
        };
        if (tipo === "Cancelacion")
          setMotivosCancel((prev) =>
            [...prev, m].sort((a, b) => a.nombre.localeCompare(b.nombre))
          );
        else
          setMotivosDevol((prev) =>
            [...prev, m].sort((a, b) => a.nombre.localeCompare(b.nombre))
          );
        return m;
      } else {
        showAlert("error", data.error ?? "No se pudo crear el motivo.");
      }
    } catch {
      showAlert("error", "Error de conexión al crear motivo.");
    }
    return null;
  };

  useEffect(() => {
    if (!isEditing || !idventa) return;
    void fetchDetalleVenta(idventa);
  }, [isEditing, idventa]);

  const fetchDetalleVenta = async (id: number): Promise<void> => {
    try {
      const res = await fetch(
        `${API_BASE}/ventas.php?action=detalle&idventa=${id}`
      );
      const data: ApiDetalleResponse = await res.json();
      if (data.success && data.info) {
        setInfo(data.info);
        setDetallesBackend(data.detalles ?? []);
        setHistorialDevoluciones(data.devoluciones ?? []);
        if (data.info.idcliente && data.info.cliente) {
          const cli: Cliente = {
            idcliente: data.info.idcliente,
            nombre: data.info.cliente,
          };
          setSelectedCliente(cli);
          setClienteSearch(cli.nombre);
        }
      } else {
        showAlert("error", data.error ?? "No se pudo obtener la venta.");
      }
    } catch {
      showAlert("error", "Error de conexión al obtener la venta.");
    }
  };

  const articulosFiltrados = articulos.filter((a) =>
    a.nombre.toLowerCase().includes(articuloSearch.toLowerCase())
  );

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(clienteSearch.toLowerCase())
  );

  const handleAgregarDetalleLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDetalle.idarticulo || !formDetalle.cantidad) {
      showAlert("error", "Selecciona un artículo y una cantidad.");
      return;
    }

    const articulo = articulos.find(
      (a) => a.idarticulo === formDetalle.idarticulo
    );
    if (!articulo) {
      showAlert("error", "Artículo no válido.");
      return;
    }

    const cantidad = Number(formDetalle.cantidad);
    if (cantidad <= 0) {
      showAlert("error", "La cantidad debe ser mayor a 0.");
      return;
    }

    if (typeof articulo.stock === "number" && articulo.stock < cantidad) {
      showAlert("error", "Stock insuficiente para este artículo.");
      return;
    }

    const precioLinea = formDetalle.precio || articulo.precio || 0;

    setDetallesLocal((prev) => {
      const existingIndex = prev.findIndex(
        (d) => d.idarticulo === articulo.idarticulo
      );

      if (existingIndex >= 0) {
        return prev.map((d, idx) => {
          if (idx !== existingIndex) return d;
          const nuevaCantidad = d.cantidad + cantidad;
          return {
            ...d,
            cantidad: nuevaCantidad,
            precio: precioLinea,
            subtotal: precioLinea * nuevaCantidad,
          };
        });
      }

      return [
        ...prev,
        {
          idarticulo: articulo.idarticulo,
          articulo: articulo.nombre,
          cantidad,
          precio: precioLinea,
          subtotal: precioLinea * cantidad,
        },
      ];
    });

    setFormDetalle({
      idarticulo: 0,
      cantidad: "",
      precio: 0,
      subtotal: 0,
    });
    setArticuloSearch("");
    setSelectedArticuloLabel("");
  };

  const handleEliminarDetalleLocal = (index: number) => {
    setDetallesLocal((prev) => prev.filter((_, i) => i !== index));
  };

  const totalLocal = detallesLocal.reduce(
    (sum, d) => sum + (d.subtotal ?? 0),
    0
  );

  const handleHacerCompra = async () => {
    if (isEditing) return;
    if (!selectedCliente) {
      const cont = confirm(
        "No hay cliente seleccionado, ¿deseas continuar la venta sin cliente?"
      );
      if (!cont) return;
    }
    if (detallesLocal.length === 0) {
      showAlert("error", "Agrega al menos un artículo antes de comprar.");
      return;
    }

    const payload = {
      idcliente: selectedCliente?.idcliente ?? null,
      detalles: detallesLocal.map((d) => ({
        idarticulo: d.idarticulo,
        cantidad: d.cantidad,
      })),
    };

    try {
      const res = await fetch(`${API_BASE}/ventas.php?action=createFull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: ApiDetalleResponse & ApiGenericResponse = await res.json();
      if (data.success && data.idventa) {
        showAlert("success", "Compra realizada correctamente.");
        setTimeout(() => {
          navigate("/dashboard/ventas");
        }, 800);
      } else {
        showAlert(
          "error",
          data.error ?? "No se pudo completar la compra (verifica stock)."
        );
      }
    } catch {
      showAlert("error", "Error de conexión al realizar la compra.");
    }
  };

  const handleClickCancelar = () => {
    if (!isEditing || !idventa) return;

    if (isCancelada) {
      const ok = confirm("¿Dar de alta (reactivar) esta venta?");
      if (!ok) return;
      void postToggleCancel();
    } else {
      setCancelReason("");
      setNuevoMotivoCancel("");
      setSelectedMotivoCancelId("");
      setShowNuevoMotivoCancel(false);
      setCancelDialogOpen(true);
    }
  };

  const postToggleCancel = async (
    idmotivo?: number,
    descripcion?: string
  ): Promise<void> => {
    if (!isEditing || !idventa) return;

    try {
      const res = await fetch(
        `${API_BASE}/ventas.php?action=toggleCancel&idventa=${idventa}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idmotivo, descripcion }),
        }
      );
      const data: ApiDetalleResponse = await res.json();
      if (data.success && data.info) {
        setInfo(data.info);
        showAlert(
          "success",
          data.info.cancelada
            ? "Venta cancelada correctamente."
            : "Venta reactivada correctamente."
        );
      } else {
        showAlert(
          "error",
          data.error ?? "No se pudo cambiar el estado de la venta."
        );
      }
    } catch {
      showAlert("error", "Error de conexión al cambiar estado.");
    }
  };

  const handleConfirmCancel = async () => {
    if (isCancelada) return;
    let idmotivo: number | undefined = undefined;

    if (!selectedMotivoCancelId && !nuevoMotivoCancel.trim()) {
      const ok = confirm(
        "No seleccionaste ni escribiste motivo, ¿quieres cancelar de todos modos?"
      );
      if (!ok) return;
    }

    if (!selectedMotivoCancelId && nuevoMotivoCancel.trim()) {
      const nuevo = await createMotivo("Cancelacion", nuevoMotivoCancel.trim());
      if (!nuevo) return;
      idmotivo = nuevo.idmotivo;
    } else if (selectedMotivoCancelId) {
      idmotivo = Number(selectedMotivoCancelId);
    }

    await postToggleCancel(idmotivo, cancelReason.trim() || undefined);
    setCancelDialogOpen(false);
  };

  // Abrir modal de devoluciones múltiples
  const handleOpenDevolucionMultiple = () => {
    if (!isEditing || !idventa || isCancelada) return;

    const itemsDisponibles = detallesBackend
      .filter((d) => {
        const devuelto = d.cantidad_devuelta ?? 0;
        const pendiente = (d.cantidad ?? 0) - devuelto;
        return pendiente > 0 && d.iddetalle_venta;
      })
      .map((d) => {
        const devuelto = d.cantidad_devuelta ?? 0;
        const pendiente = (d.cantidad ?? 0) - devuelto;
        return {
          iddetalle_venta: d.iddetalle_venta!,
          idarticulo: d.idarticulo,
          articulo: d.articulo,
          cantidadMaxima: pendiente,
          cantidadDevolver: 0,
          precio: d.precio ?? 0,
        };
      });

    if (itemsDisponibles.length === 0) {
      showAlert("error", "No hay artículos disponibles para devolución.");
      return;
    }

    setDevolucionesItems(itemsDisponibles);
    setDevolReason("");
    setNuevoMotivoDevol("");
    setSelectedMotivoDevolId("");
    setShowNuevoMotivoDevol(false);
    setDevolMultipleDialogOpen(true);
  };

  const handleUpdateCantidadDevolucion = (
    iddetalle_venta: number,
    cantidad: number
  ) => {
    setDevolucionesItems((prev) =>
      prev.map((item) =>
        item.iddetalle_venta === iddetalle_venta
          ? {
              ...item,
              cantidadDevolver: Math.max(
                0,
                Math.min(cantidad, item.cantidadMaxima)
              ),
            }
          : item
      )
    );
  };

  const handleConfirmDevolucionMultiple = async () => {
    if (!isEditing || !idventa) return;

    const itemsADevolver = devolucionesItems.filter(
      (item) => item.cantidadDevolver > 0
    );

    if (itemsADevolver.length === 0) {
      showAlert(
        "error",
        "Debes indicar al menos un artículo con cantidad a devolver."
      );
      return;
    }

    let idmotivo: number | undefined = undefined;

    if (!selectedMotivoDevolId && !nuevoMotivoDevol.trim()) {
      const ok = confirm(
        "No seleccionaste ni escribiste motivo, ¿quieres registrar las devoluciones de todos modos?"
      );
      if (!ok) return;
    }

    if (!selectedMotivoDevolId && nuevoMotivoDevol.trim()) {
      const nuevo = await createMotivo("Devolucion", nuevoMotivoDevol.trim());
      if (!nuevo) return;
      idmotivo = nuevo.idmotivo;
    } else if (selectedMotivoDevolId) {
      idmotivo = Number(selectedMotivoDevolId);
    }

    // Procesar cada devolución
    let errorOcurrido = false;
    for (const item of itemsADevolver) {
      const payload = {
        idventa,
        iddetalle_venta: item.iddetalle_venta,
        cantidad: item.cantidadDevolver,
        idmotivo,
        descripcion: devolReason.trim() || undefined,
      };

      try {
        const res = await fetch(
          `${API_BASE}/ventas.php?action=devolverParcial`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data: ApiDetalleResponse = await res.json();
        if (!data.success) {
          showAlert(
            "error",
            data.error ?? `Error al devolver ${item.articulo}`
          );
          errorOcurrido = true;
          break;
        }
      } catch {
        showAlert("error", `Error de conexión al devolver ${item.articulo}`);
        errorOcurrido = true;
        break;
      }
    }

    if (!errorOcurrido) {
      showAlert("success", "Devoluciones registradas correctamente.");
      setDevolMultipleDialogOpen(false);
      await fetchDetalleVenta(idventa);
    }
  };

  const tituloPantalla = isEditing
    ? `Detalles de Venta #${idventa}`
    : "Nueva venta";

  const totalMostrar = isEditing && info ? info.total : totalLocal;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">{tituloPantalla}</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate("/dashboard/ventas")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          {!isEditing && (
            <Button
              onClick={handleHacerCompra}
              className="bg-gray-800 text-white hover:bg-gray-700 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Hacer compra
            </Button>
          )}
        </div>
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

      {isEditing && info && (
        <div className="mb-6 bg-card rounded-lg p-4 shadow-sm space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p>
                <strong>Fecha:</strong> {info.fecha}
              </p>
              <p>
                <strong>Total actual:</strong> ${info.total.toFixed(2)}
              </p>
            </div>
            <div>
              <p>
                <strong>Estado:</strong>{" "}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isCancelada
                      ? "bg-red-600 text-white"
                      : "bg-green-600 text-white"
                  }`}
                >
                  {isCancelada ? "Cancelada" : "Activa"}
                </span>
              </p>
            </div>
            <div>
              <p>
                <strong>Cliente:</strong>{" "}
                {selectedCliente ? selectedCliente.nombre : "Sin asignar"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <Button
              variant={isCancelada ? "outline" : "destructive"}
              onClick={handleClickCancelar}
              className="flex items-center gap-2"
            >
              <Ban className="h-4 w-4" />
              {isCancelada ? "Dar de alta venta" : "Cancelar venta"}
            </Button>

            {!isCancelada && (
              <Button
                variant="outline"
                onClick={handleOpenDevolucionMultiple}
                className="flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <RotateCcw className="h-4 w-4" />
                Registrar devoluciones
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="mb-6 bg-card rounded-xl p-4 shadow-lg">
        <Label>Cliente</Label>
        <div ref={clienteMenuRef} className="mt-1 relative">
          <div
            className="flex items-center justify-between border rounded-lg px-3 py-2 cursor-text hover:border-gray-400 transition"
            onClick={() => {
              if (!isEditing) setIsClienteMenuOpen(true);
            }}
          >
            <input
              type="text"
              placeholder="Seleccionar cliente..."
              value={
                isClienteMenuOpen
                  ? clienteSearch
                  : selectedCliente?.nombre ?? ""
              }
              onFocus={() => {
                if (!isEditing) setIsClienteMenuOpen(true);
              }}
              onChange={(e) => {
                if (isEditing) return;
                setClienteSearch(e.target.value);
                setIsClienteMenuOpen(true);
              }}
              className="w-full outline-none bg-transparent text-sm"
              readOnly={isEditing}
            />
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>

          {isClienteMenuOpen && !isEditing && (
            <div className="absolute z-50 mt-1 w-full border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto bg-card">
              <Command>
                <CommandList>
                  {clientesFiltrados.length > 0 ? (
                    clientesFiltrados.map((c) => (
                      <CommandItem
                        key={c.idcliente}
                        onSelect={() => {
                          setSelectedCliente(c);
                          setClienteSearch(c.nombre);
                          setIsClienteMenuOpen(false);
                        }}
                        className="cursor-pointer hover:bg-accent px-3 py-2 text-sm"
                      >
                        {c.nombre}
                      </CommandItem>
                    ))
                  ) : (
                    <CommandEmpty className="px-3 py-2 text-gray-500">
                      No se encontraron clientes.
                    </CommandEmpty>
                  )}
                </CommandList>
              </Command>
            </div>
          )}
        </div>
      </div>

      {!isEditing && (
        <form
          onSubmit={handleAgregarDetalleLocal}
          className="space-y-6 bg-card p-6 rounded-xl shadow-lg mb-6"
        >
          <div>
            <Label>Artículo</Label>
            <div ref={articuloMenuRef} className="mt-1 relative">
              <div
                className="flex items-center justify-between border rounded-lg px-3 py-2 cursor-text hover:border-gray-400 transition"
                onClick={() => setIsArticuloMenuOpen(true)}
              >
                <input
                  type="text"
                  placeholder="Seleccionar artículo..."
                  value={
                    isArticuloMenuOpen ? articuloSearch : selectedArticuloLabel
                  }
                  onFocus={() => {
                    setIsArticuloMenuOpen(true);
                    setArticuloSearch("");
                  }}
                  onChange={(e) => {
                    setArticuloSearch(e.target.value);
                    setIsArticuloMenuOpen(true);
                  }}
                  className="w-full outline-none bg-transparent text-sm"
                />
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </div>

              {isArticuloMenuOpen && (
                <div className="absolute z-50 mt-1 w-full border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto bg-card">
                  <Command>
                    <CommandList>
                      {articulosFiltrados.length > 0 ? (
                        articulosFiltrados.map((a) => (
                          <CommandItem
                            key={a.idarticulo}
                            onSelect={() => {
                              setFormDetalle((prev) => {
                                const cantidadNum = prev.cantidad
                                  ? Number(prev.cantidad)
                                  : 0;
                                const precio = a.precio ?? 0;
                                return {
                                  ...prev,
                                  idarticulo: a.idarticulo,
                                  precio,
                                  subtotal:
                                    precio *
                                    (isNaN(cantidadNum) ? 0 : cantidadNum),
                                };
                              });
                              setSelectedArticuloLabel(a.nombre);
                              setArticuloSearch("");
                              setIsArticuloMenuOpen(false);
                            }}
                            className="cursor-pointer hover:bg-accent px-3 py-2 text-sm"
                          >
                            {a.nombre}
                            {typeof a.stock === "number" && (
                              <> (Stock: {a.stock})</>
                            )}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Cantidad</Label>
              <Input
                type="number"
                value={formDetalle.cantidad}
                onChange={(e) => {
                  const value = e.target.value;
                  const num = Number(value);
                  setFormDetalle((prev) => ({
                    ...prev,
                    cantidad: value,
                    subtotal: prev.precio * (isNaN(num) ? 0 : num),
                  }));
                }}
                required
              />
            </div>
            <div>
              <Label>Precio</Label>
              <Input
                type="text"
                value={formDetalle.precio.toFixed(2)}
                readOnly
              />
            </div>
            <div>
              <Label>Subtotal</Label>
              <Input
                type="text"
                value={formDetalle.subtotal.toFixed(2)}
                readOnly
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full bg-gray-800 text-white hover:bg-gray-700"
              >
                Agregar
              </Button>
            </div>
          </div>
        </form>
      )}

      <Tabs defaultValue="detalles" className="mt-2">
        <TabsList>
          <TabsTrigger value="detalles">Artículos vendidos</TabsTrigger>
          <TabsTrigger value="devoluciones">
            Historial de devoluciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detalles" className="mt-4">
          <Table className="border border-gray-200 rounded-lg">
            <TableHeader>
              <TableRow>
                <TableHead>Artículo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Subtotal (a pagar)</TableHead>
                {isEditing && (
                  <>
                    <TableHead>Devuelto</TableHead>
                    <TableHead>Pendiente</TableHead>
                  </>
                )}
                {!isEditing && <TableHead>Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isEditing ? (
                detallesBackend.length > 0 ? (
                  detallesBackend.map((d) => {
                    const devuelto = d.cantidad_devuelta ?? 0;
                    const pendiente = (d.cantidad ?? 0) - devuelto;
                    return (
                      <TableRow key={d.iddetalle_venta}>
                        <TableCell>{d.articulo}</TableCell>
                        <TableCell>{d.cantidad}</TableCell>
                        <TableCell>
                          ${Number(d.precio ?? 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          ${Number(d.subtotal ?? 0).toFixed(2)}
                        </TableCell>
                        <TableCell>{devuelto}</TableCell>
                        <TableCell>{pendiente}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-gray-500 py-4"
                    >
                      No hay detalles para esta venta.
                    </TableCell>
                  </TableRow>
                )
              ) : detallesLocal.length > 0 ? (
                detallesLocal.map((d, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{d.articulo}</TableCell>
                    <TableCell>{d.cantidad}</TableCell>
                    <TableCell>${Number(d.precio ?? 0).toFixed(2)}</TableCell>
                    <TableCell>${Number(d.subtotal ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEliminarDetalleLocal(idx)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-gray-500 py-4"
                  >
                    No hay artículos agregados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 text-right font-semibold">
            Total: ${Number(totalMostrar).toFixed(2)}
          </div>
        </TabsContent>

        <TabsContent value="devoluciones" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Artículo</TableHead>
                <TableHead>Cantidad devuelta</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historialDevoluciones.length > 0 ? (
                historialDevoluciones.map((d) => (
                  <TableRow key={d.iddevolucion_detalle}>
                    <TableCell>{d.fecha_devolucion}</TableCell>
                    <TableCell>{d.articulo}</TableCell>
                    <TableCell>{d.cantidad_devuelta}</TableCell>
                    <TableCell>${d.subtotal.toFixed(2)}</TableCell>
                    <TableCell>{d.motivo}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-gray-500 py-4"
                  >
                    No hay devoluciones registradas para esta venta.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Dialog cancelación */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-sm">Motivo (catálogo)</Label>
              <select
                title="motivo"
                className="mt-1 w-full border rounded-md p-2 text-sm"
                value={selectedMotivoCancelId}
                onChange={(e) => setSelectedMotivoCancelId(e.target.value)}
              >
                <option value="">-- Seleccionar motivo --</option>
                {motivosCancel.map((m) => (
                  <option key={m.idmotivo} value={m.idmotivo}>
                    {m.nombre}
                  </option>
                ))}
              </select>
              {motivosCancel.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No hay motivos de cancelación registrados, puedes crear uno
                  abajo.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setShowNuevoMotivoCancel((prev) => !prev)}
              >
                <Plus className="h-4 w-4" />
                {showNuevoMotivoCancel
                  ? "Ocultar nuevo motivo"
                  : "Agregar nuevo motivo"}
              </Button>
              {showNuevoMotivoCancel && (
                <div>
                  <Label className="text-sm">
                    Crear nuevo motivo (si no existe)
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="Ej. Error en el cobro"
                    value={nuevoMotivoCancel}
                    onChange={(e) => setNuevoMotivoCancel(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm">
                Descripción adicional (opcional)
              </Label>
              <textarea
                title="descripcion"
                className="w-full border rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 mt-1"
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Cerrar
            </Button>
            <Button
              variant="destructive"
              className="flex items-center gap-2"
              onClick={handleConfirmCancel}
            >
              <Ban className="h-4 w-4" />
              Cancelar venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog devolución múltiple */}
      <Dialog
        open={devolMultipleDialogOpen}
        onOpenChange={setDevolMultipleDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar devoluciones</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-3">
                Artículos disponibles para devolución
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artículo</TableHead>
                    <TableHead>Disponible</TableHead>
                    <TableHead>Precio Unit.</TableHead>
                    <TableHead>Cantidad a devolver</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devolucionesItems.map((item) => (
                    <TableRow key={item.iddetalle_venta}>
                      <TableCell className="font-medium">
                        {item.articulo}
                      </TableCell>
                      <TableCell>{item.cantidadMaxima}</TableCell>
                      <TableCell>${item.precio.toFixed(2)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={item.cantidadMaxima}
                          value={item.cantidadDevolver}
                          onChange={(e) =>
                            handleUpdateCantidadDevolucion(
                              item.iddetalle_venta,
                              Number(e.target.value)
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${(item.cantidadDevolver * item.precio).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 text-right">
                <span className="text-lg font-bold">
                  Total a devolver: $
                  {devolucionesItems
                    .reduce(
                      (sum, item) => sum + item.cantidadDevolver * item.precio,
                      0
                    )
                    .toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <Label className="text-sm">Motivo (catálogo)</Label>
              <select
                title="motivo"
                className="mt-1 w-full border rounded-md p-2 text-sm"
                value={selectedMotivoDevolId}
                onChange={(e) => setSelectedMotivoDevolId(e.target.value)}
              >
                <option value="">-- Seleccionar motivo --</option>
                {motivosDevol.map((m) => (
                  <option key={m.idmotivo} value={m.idmotivo}>
                    {m.nombre}
                  </option>
                ))}
              </select>
              {motivosDevol.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No hay motivos de devolución registrados, puedes crear uno
                  abajo.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setShowNuevoMotivoDevol((prev) => !prev)}
              >
                <Plus className="h-4 w-4" />
                {showNuevoMotivoDevol
                  ? "Ocultar nuevo motivo"
                  : "Agregar nuevo motivo"}
              </Button>
              {showNuevoMotivoDevol && (
                <div>
                  <Label className="text-sm">
                    Crear nuevo motivo (si no existe)
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="Ej. Producto defectuoso"
                    value={nuevoMotivoDevol}
                    onChange={(e) => setNuevoMotivoDevol(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm">
                Descripción adicional (opcional)
              </Label>
              <textarea
                title="descripcion"
                className="w-full border rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 mt-1"
                rows={3}
                value={devolReason}
                onChange={(e) => setDevolReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDevolMultipleDialogOpen(false)}
            >
              Cerrar
            </Button>
            <Button
              variant="default"
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleConfirmDevolucionMultiple}
            >
              <RotateCcw className="h-4 w-4" />
              Registrar devoluciones
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VentasDetalle;
