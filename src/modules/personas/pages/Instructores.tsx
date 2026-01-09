import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Search,
  Edit,
  Power,
  Save,
  Pencil,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Deporte {
  iddeporte: number;
  nombre: string;
  color: string;
}

interface Instructor {
  idinstructor: number;
  nombre: string;
  appaterno: string;
  apmaterno: string;
  telefono: string;
  correo: string;
  estado: "Activo" | "Inactivo";
  fecha_creacion: string;
  iddeporte: number;
  deporte?: string;
  color_deporte?: string;
}

interface ApiResponse {
  success?: boolean;
  instructores?: Instructor[];
  total?: number;
  error?: string;
}

const Instructores: React.FC = () => {
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [tab, setTab] = useState<"activos" | "inactivos">("activos");

  // Estados para modal de crear/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [instructorSeleccionado, setInstructorSeleccionado] =
    useState<Instructor | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    appaterno: "",
    apmaterno: "",
    telefono: "",
    correo: "",
    iddeporte: 0,
  });

  // Estados para diálogos de confirmación
  const [dialogEstado, setDialogEstado] = useState(false);
  const [instructorParaAccion, setInstructorParaAccion] =
    useState<Instructor | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    void fetchInstructores();
    void fetchDeportes();
  }, [page, search, tab]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
  };

  const fetchInstructores = async (): Promise<void> => {
    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/instructores.php?action=list&page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}&estado=${tab === "activos" ? "Activo" : "Inactivo"}`
      );
      const data: ApiResponse = await res.json();
      if (data.success) {
        setInstructores(data.instructores ?? []);
        setTotal(data.total ?? 0);
      } else if (data.error) {
        showAlert("error", data.error);
      }
    } catch {
      showAlert("error", "Error al conectar con el servidor.");
    }
  };

  const fetchDeportes = async (): Promise<void> => {
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/instructores.php?action=deportes"
      );
      const data = await res.json();
      if (data.success) {
        setDeportes(data.deportes ?? []);
      }
    } catch {
      console.error("Error al cargar deportes");
    }
  };

  const handleNuevoInstructor = (): void => {
    setIsEditing(false);
    setInstructorSeleccionado(null);
    setFormData({
      nombre: "",
      appaterno: "",
      apmaterno: "",
      telefono: "",
      correo: "",
      iddeporte: 0,
    });
    setModalOpen(true);
  };

  const handleEditarInstructor = (instructor: Instructor): void => {
    setIsEditing(true);
    setInstructorSeleccionado(instructor);
    setFormData({
      nombre: instructor.nombre,
      appaterno: instructor.appaterno,
      apmaterno: instructor.apmaterno,
      telefono: instructor.telefono,
      correo: instructor.correo,
      iddeporte: instructor.iddeporte,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (
      !formData.nombre ||
      !formData.appaterno ||
      !formData.telefono ||
      !formData.correo ||
      !formData.iddeporte
    ) {
      showAlert("error", "Por favor completa todos los campos obligatorios");
      return;
    }

    setProcessing(true);

    try {
      const url = isEditing
        ? "http://localhost/GymSerra/public/api/instructores.php?action=update"
        : "http://localhost/GymSerra/public/api/instructores.php?action=create";

      const payload = isEditing
        ? { ...formData, idinstructor: instructorSeleccionado?.idinstructor }
        : formData;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        showAlert(
          "success",
          isEditing
            ? "Instructor actualizado correctamente"
            : "Instructor creado correctamente"
        );
        setModalOpen(false);
        await fetchInstructores();
      } else {
        showAlert("error", data.error ?? "Error al guardar");
      }
    } catch {
      showAlert("error", "Error de conexión");
    } finally {
      setProcessing(false);
    }
  };

  const handleAbrirDialogEstado = (instructor: Instructor): void => {
    setInstructorParaAccion(instructor);
    setDialogEstado(true);
  };

  const handleToggleEstado = async (): Promise<void> => {
    if (!instructorParaAccion) return;

    setProcessing(true);
    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/instructores.php?action=toggleEstado&idinstructor=${instructorParaAccion.idinstructor}`,
        { method: "POST" }
      );
      const data = await res.json();

      if (data.success) {
        showAlert(
          "success",
          `Instructor ${data.estado.toLowerCase()} correctamente`
        );
        await fetchInstructores();
      } else {
        showAlert("error", data.error ?? "Error al cambiar estado");
      }
    } catch {
      showAlert("error", "Error de conexión");
    } finally {
      setProcessing(false);
      setDialogEstado(false);
      setInstructorParaAccion(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const instructoresActivos = instructores.filter((i) => i.estado === "Activo");
  const instructoresInactivos = instructores.filter(
    (i) => i.estado === "Inactivo"
  );

  const renderNombreCompleto = (instructor: Instructor) => {
    return `${instructor.nombre} ${instructor.appaterno} ${instructor.apmaterno}`;
  };

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

      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, correo o teléfono..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 rounded-lg shadow-md"
          />
        </div>
        <Button
          onClick={handleNuevoInstructor}
          className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Instructor
        </Button>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as typeof tab)}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="activos" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Activos
          </TabsTrigger>
          <TabsTrigger value="inactivos" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Inactivos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activos">
          <Table className="rounded-lg shadow-sm">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Deporte</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructoresActivos.length > 0 ? (
                instructoresActivos.map((instructor) => (
                  <TableRow key={instructor.idinstructor}>
                    <TableCell>{instructor.idinstructor}</TableCell>
                    <TableCell className="font-medium">
                      {renderNombreCompleto(instructor)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor:
                            instructor.color_deporte || "#808080",
                          color: "#fff",
                        }}
                        className="shadow-sm"
                      >
                        {instructor.deporte || "Sin deporte"}
                      </Badge>
                    </TableCell>
                    <TableCell>{instructor.telefono}</TableCell>
                    <TableCell className="text-sm">
                      {instructor.correo}
                    </TableCell>
                    <TableCell>
                      {new Date(instructor.fecha_creacion).toLocaleDateString(
                        "es-MX"
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditarInstructor(instructor)}
                        >
                          <Pencil className="h-4 w-4 " />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAbrirDialogEstado(instructor)}
                        >
                          <Power className="h-4 w-4 text-orange-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-gray-600 py-4"
                  >
                    No se encontraron instructores activos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="inactivos">
          <Table className="rounded-lg shadow-sm">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Deporte</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructoresInactivos.length > 0 ? (
                instructoresInactivos.map((instructor) => (
                  <TableRow key={instructor.idinstructor}>
                    <TableCell>{instructor.idinstructor}</TableCell>
                    <TableCell className="font-medium">
                      {renderNombreCompleto(instructor)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor:
                            instructor.color_deporte || "#808080",
                          color: "#fff",
                        }}
                        className="shadow-sm"
                      >
                        {instructor.deporte || "Sin deporte"}
                      </Badge>
                    </TableCell>
                    <TableCell>{instructor.telefono}</TableCell>
                    <TableCell className="text-sm">
                      {instructor.correo}
                    </TableCell>
                    <TableCell>
                      {new Date(instructor.fecha_creacion).toLocaleDateString(
                        "es-MX"
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditarInstructor(instructor)}
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAbrirDialogEstado(instructor)}
                        >
                          <Power className="h-4 w-4 text-green-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-gray-600 py-4"
                  >
                    No hay instructores inactivos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between mt-4">
        <Button
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="bg-gray-800 hover:bg-gray-600 text-white font-medium"
        >
          Anterior
        </Button>
        <span>
          Página {page} de {totalPages}
        </span>
        <Button
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="bg-gray-800 hover:bg-gray-600 text-white font-medium"
        >
          Siguiente
        </Button>
      </div>

      {/* Modal Crear/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Instructor" : "Nuevo Instructor"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifica los datos del instructor"
                : "Completa los datos del nuevo instructor"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    placeholder="Ej. Juan"
                    required
                  />
                </div>
                <div>
                  <Label>
                    Apellido Paterno <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.appaterno}
                    onChange={(e) =>
                      setFormData({ ...formData, appaterno: e.target.value })
                    }
                    placeholder="Ej. Pérez"
                    required
                  />
                </div>
                <div>
                  <Label>Apellido Materno</Label>
                  <Input
                    value={formData.apmaterno}
                    onChange={(e) =>
                      setFormData({ ...formData, apmaterno: e.target.value })
                    }
                    placeholder="Ej. García"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>
                    Teléfono <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                    placeholder="Ej. 4431234567"
                    required
                  />
                </div>
                <div>
                  <Label>
                    Correo Electrónico <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={formData.correo}
                    onChange={(e) =>
                      setFormData({ ...formData, correo: e.target.value })
                    }
                    placeholder="Ej. instructor@gimnasio.com"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>
                  Deporte <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={String(formData.iddeporte)}
                  onValueChange={(value) =>
                    setFormData({ ...formData, iddeporte: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar deporte" />
                  </SelectTrigger>
                  <SelectContent>
                    {deportes.map((deporte) => (
                      <SelectItem
                        key={deporte.iddeporte}
                        value={String(deporte.iddeporte)}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: deporte.color }}
                          />
                          {deporte.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={processing}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={processing}
                className="bg-gray-800 text-white hover:bg-gray-700"
              >
                {processing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Cambiar Estado */}
      <Dialog open={dialogEstado} onOpenChange={setDialogEstado}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {instructorParaAccion?.estado === "Activo"
                ? "Desactivar"
                : "Activar"}{" "}
              Instructor
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas{" "}
              {instructorParaAccion?.estado === "Activo"
                ? "desactivar"
                : "activar"}{" "}
              a{" "}
              {instructorParaAccion
                ? renderNombreCompleto(instructorParaAccion)
                : ""}
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogEstado(false)}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleToggleEstado}
              disabled={processing}
              className="bg-gray-800 text-gray-100 hover:bg-gray-600"
            >
              {processing ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Instructores;
