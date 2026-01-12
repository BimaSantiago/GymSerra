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
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Pencil, Eye } from "lucide-react";

const API_BASE = "https://academiagymserra.garzas.store";

interface Proveedor {
  idproveedor: number;
  nombre: string;
  RFC: string;
  codigo_postal: string | null;
  calle: string;
  localidad: string;
  municipio: string;
  telefono: string;
  correo: string;
  estado: string;
  nombre_vendedor: string;
  telefono_vendedor: string;
  correo_vendedor: string;
}

interface Compra {
  idcompra: number;
  fecha: string;
  total: number;
}

interface DetalleCompra {
  iddetalle_compra: number;
  articulo: string;
  cantidad: number;
  subtotal: number;
  idcosto: number;
  idprecio: number;
}

const ProveedoresDashboard = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [detalles, setDetalles] = useState<DetalleCompra[]>([]);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(
    null
  );
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");

  // Form con nueva estructura de BD
  const [form, setForm] = useState({
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

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPurchasesOpen, setIsPurchasesOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Paso del wizard: 1 = Datos empresa, 2 = Datos proveedor
  const [step, setStep] = useState<1 | 2>(1);

  const fetchProveedores = async () => {
    const response = await fetch(
      `${API_BASE}/api/proveedores.php?action=list&page=${page}&limit=${limit}&search=${encodeURIComponent(
        search
      )}`
    );
    const data = await response.json();
    setProveedores(data.proveedores || []);
    setTotal(data.total || 0);
  };

  useEffect(() => {
    fetchProveedores();
  }, [page, search]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones mínimas
    if (
      !form.nombre ||
      !form.RFC ||
      !form.calle ||
      !form.localidad ||
      !form.municipio
    ) {
      setAlert({
        type: "error",
        message:
          "Completa los datos básicos de la empresa: nombre, RFC, calle, localidad y municipio.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }
    if (
      !form.nombre_vendedor ||
      !form.telefono_vendedor ||
      !form.correo_vendedor
    ) {
      setAlert({
        type: "error",
        message:
          "Completa los datos del proveedor: nombre, teléfono y correo del vendedor.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    const url = isEditing
      ? `${API_BASE}/api/proveedores.php?action=update`
      : `${API_BASE}/api/proveedores.php?action=create`;

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
          ? "Proveedor actualizado correctamente"
          : "Proveedor creado correctamente",
      });
      fetchProveedores();
      setIsDialogOpen(false);
      resetForm();
    } else {
      setAlert({
        type: "error",
        message: data.error || "Error al guardar el proveedor",
      });
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handleEdit = async (idproveedor: number) => {
    const response = await fetch(
      `${API_BASE}/api/proveedores.php?action=get&idproveedor=${idproveedor}`
    );
    const data = await response.json();
    if (data.success) {
      const p: Proveedor = data.proveedor;
      setForm({
        idproveedor: p.idproveedor,
        nombre: p.nombre || "",
        RFC: p.RFC || "",
        codigo_postal: p.codigo_postal || "",
        calle: p.calle || "",
        localidad: p.localidad || "",
        municipio: p.municipio || "",
        telefono: p.telefono || "",
        correo: p.correo || "",
        estado: p.estado || "Activo",
        nombre_vendedor: p.nombre_vendedor || "",
        telefono_vendedor: p.telefono_vendedor || "",
        correo_vendedor: p.correo_vendedor || "",
      });
      setIsEditing(true);
      setStep(1);
      setIsDialogOpen(true);
    } else {
      setAlert({
        type: "error",
        message: data.error || "Proveedor no encontrado",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleViewCompras = async (prov: Proveedor) => {
    setSelectedProveedor(prov);
    const response = await fetch(
      `${API_BASE}/api/proveedores.php?action=purchases&idproveedor=${prov.idproveedor}`
    );
    const data = await response.json();
    if (data.success) {
      setCompras(data.compras || []);
      setIsPurchasesOpen(true);
    } else {
      setCompras([]);
      setAlert({
        type: "error",
        message: data.error || "No se pudieron cargar las compras",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleViewDetalleCompra = async (compra: Compra) => {
    setSelectedCompra(compra);
    const response = await fetch(
      `${API_BASE}/api/proveedores.php?action=purchase_detail&idcompra=${compra.idcompra}`
    );
    const data = await response.json();
    if (data.success) {
      setDetalles(data.detalles || []);
      setIsDetailsOpen(true);
    } else {
      setDetalles([]);
      setAlert({
        type: "error",
        message: data.error || "No se pudo cargar el detalle",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const resetForm = () => {
    setForm({
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
    setIsEditing(false);
    setStep(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-4">
      {/* ALERTAS */}
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

      {/* BUSCADOR + BOTÓN NUEVO */}
      <div className="flex justify-between mb-6">
        <Input
          placeholder="Buscar proveedor..."
          value={search}
          onChange={handleSearch}
          className="max-w-sm rounded-lg shadow-md"
        />
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsEditing(false);
                setStep(1);
              }}
              className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg"
            >
              Agregar Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Editar Proveedor" : "Nuevo Proveedor"}
              </DialogTitle>
            </DialogHeader>

            {/* WIZARD DE 2 PASOS */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step === 1
                      ? "bg-gray-300 text-gray-700"
                      : "bg-gray-800 text-white"
                  }`}
                >
                  1
                </div>
                <span className="text-sm font-medium">Datos de la empresa</span>
              </div>
              <div className="flex-1 h-px bg-gray-300 mx-2" />
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step === 2
                      ? "bg-gray-300 text-gray-700"
                      : "bg-gray-800 text-white"
                  }`}
                >
                  2
                </div>
                <span className="text-sm font-medium">Datos del proveedor</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* PASO 1: DATOS EMPRESA */}
              {step === 1 && (
                <div className="space-y-3">
                  <div>
                    <Label>Nombre de la empresa</Label>
                    <Input
                      value={form.nombre}
                      onChange={(e) =>
                        setForm({ ...form, nombre: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>RFC</Label>
                    <Input
                      value={form.RFC}
                      onChange={(e) =>
                        setForm({ ...form, RFC: e.target.value.toUpperCase() })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Código Postal</Label>
                      <Input
                        value={form.codigo_postal || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            codigo_postal: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Teléfono empresa</Label>
                      <Input
                        value={form.telefono}
                        onChange={(e) =>
                          setForm({ ...form, telefono: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Correo empresa</Label>
                      <Input
                        type="email"
                        value={form.correo}
                        onChange={(e) =>
                          setForm({ ...form, correo: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Calle</Label>
                    <Input
                      value={form.calle}
                      onChange={(e) =>
                        setForm({ ...form, calle: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Localidad / Colonia</Label>
                      <Input
                        value={form.localidad}
                        onChange={(e) =>
                          setForm({ ...form, localidad: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Municipio / Ciudad</Label>
                      <Input
                        value={form.municipio}
                        onChange={(e) =>
                          setForm({ ...form, municipio: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Estado</Label>
                    <select
                      id="estado"
                      value={form.estado}
                      aria-label="Estado"
                      onChange={(e) =>
                        setForm({ ...form, estado: e.target.value })
                      }
                      className="border rounded-md p-2 w-full"
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      className="bg-gray-800 text-white hover:bg-gray-700"
                      onClick={() => setStep(2)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}

              {/* PASO 2: DATOS PROVEEDOR (VENDEDOR) */}
              {step === 2 && (
                <div className="space-y-3">
                  <div>
                    <Label>Nombre del vendedor</Label>
                    <Input
                      value={form.nombre_vendedor}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          nombre_vendedor: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Teléfono del vendedor</Label>
                    <Input
                      value={form.telefono_vendedor}
                      onChange={(e) =>
                        setForm({
                          ...form,
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
                      value={form.correo_vendedor}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          correo_vendedor: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="flex justify-between gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                    >
                      Atrás
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gray-800 text-white hover:bg-gray-700 "
                    >
                      {isEditing ? "Actualizar" : "Crear"}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* TABLA PRINCIPAL */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>RFC</TableHead>
            <TableHead>Teléfono Empresa</TableHead>
            <TableHead>Correo Empresa</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Teléfono Vendedor</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proveedores.map((prov) => (
            <TableRow key={prov.idproveedor}>
              <TableCell>{prov.idproveedor}</TableCell>
              <TableCell>{prov.nombre}</TableCell>
              <TableCell>{prov.RFC}</TableCell>
              <TableCell>{prov.telefono}</TableCell>
              <TableCell>{prov.correo}</TableCell>
              <TableCell>{prov.nombre_vendedor}</TableCell>
              <TableCell>{prov.telefono_vendedor}</TableCell>
              <TableCell>{prov.estado}</TableCell>
              <TableCell className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(prov.idproveedor)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleViewCompras(prov)}
                >
                  <Eye className="h-4 w-4 text-blue-700" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* PAGINACIÓN */}
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

      {/* Dialog de Compras */}
      <Dialog open={isPurchasesOpen} onOpenChange={setIsPurchasesOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compras de {selectedProveedor?.nombre}</DialogTitle>
          </DialogHeader>
          {compras.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Compra</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compras.map((c) => (
                  <TableRow
                    key={c.idcompra}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleViewDetalleCompra(c)}
                  >
                    <TableCell>{c.idcompra}</TableCell>
                    <TableCell>
                      {new Date(c.fecha).toLocaleDateString()}
                    </TableCell>
                    <TableCell>${c.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-600 text-center py-4">
              No se encontraron compras registradas.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Detalle de Compra */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalle de Compra #{selectedCompra?.idcompra}
            </DialogTitle>
          </DialogHeader>
          {detalles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artículo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>ID Costo</TableHead>
                  <TableHead>ID Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalles.map((d) => (
                  <TableRow key={d.iddetalle_compra}>
                    <TableCell>{d.articulo}</TableCell>
                    <TableCell>{d.cantidad}</TableCell>
                    <TableCell>${d.subtotal.toFixed(2)}</TableCell>
                    <TableCell>{d.idcosto}</TableCell>
                    <TableCell>{d.idprecio}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-600 text-center py-4">
              No hay detalles disponibles para esta compra.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProveedoresDashboard;
