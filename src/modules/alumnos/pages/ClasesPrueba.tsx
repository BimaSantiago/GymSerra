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
  Calendar,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Alumno {
  idalumno: number;
  nombre_completo: string;
  curp: string;
}

interface Horario {
  idhorario: number;
  hora_inicio: number;
  hora_fin: number;
  dia: number;
  idnivel: number;
  iddeporte: number;
  // Posibles joins: nombre_nivel, nombre_deporte
  descripcion?: string; // Ej: "Lunes 14:30-15:00 - Nivel 1 Gimnasia"
}

interface ClasePrueba {
  idclase_prueba: number;
  idalumno: number;
  idhorario: number;
  fecha_clase: string;
  estado: "Programada" | "Tomada";
  alumno_nombre?: string;
  horario_descripcion?: string;
  deporte_nombre?: string;
  deporte_color?: string;
}

interface ApiResponse {
  success?: boolean;
  clases_prueba?: ClasePrueba[];
  total?: number;
  error?: string;
}

const API_BASE = "http://localhost/GymSerra/public/api/";

const ClasesPrueba: React.FC = () => {
  const [clasesPrueba, setClasesPrueba] = useState<ClasePrueba[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [tab, setTab] = useState<"programadas" | "tomadas">("programadas");

  // Estados para modal de crear/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [claseSeleccionada, setClaseSeleccionada] =
    useState<ClasePrueba | null>(null);
  const [formData, setFormData] = useState({
    idalumno: 0,
    idhorario: 0,
    fecha_clase: "",
  });

  // Estados para diálogos de confirmación
  const [dialogEstado, setDialogEstado] = useState(false);
  const [claseParaAccion, setClaseParaAccion] = useState<ClasePrueba | null>(
    null
  );
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    void fetchClasesPrueba();
    void fetchAlumnos();
    void fetchHorarios();
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

  const fetchClasesPrueba = async (): Promise<void> => {
    try {
      const res = await fetch(
        API_BASE +
          `clases_prueba.php?action=list&page=${page}&limit=${limit}&search=${encodeURIComponent(
            search
          )}&estado=${tab === "programadas" ? "Programada" : "Tomada"}`
      );
      const data: ApiResponse = await res.json();
      if (data.success) {
        setClasesPrueba(data.clases_prueba ?? []);
        setTotal(data.total ?? 0);
      } else if (data.error) {
        showAlert("error", data.error);
      }
    } catch {
      showAlert("error", "Error al conectar con el servidor.");
    }
  };

  const fetchAlumnos = async (): Promise<void> => {
    try {
      const res = await fetch(API_BASE + "clases_prueba.php?action=alumnos");
      const data = await res.json();
      if (data.success) {
        setAlumnos(data.alumnos ?? []);
      }
    } catch {
      console.error("Error al cargar alumnos");
    }
  };

  const fetchHorarios = async (): Promise<void> => {
    try {
      const res = await fetch(API_BASE + "clases_prueba.php?action=horarios");
      const data = await res.json();
      if (data.success) {
        setHorarios(data.horarios ?? []);
      }
    } catch {
      console.error("Error al cargar horarios");
    }
  };

  const handleNuevaClase = (): void => {
    setIsEditing(false);
    setClaseSeleccionada(null);
    setFormData({
      idalumno: 0,
      idhorario: 0,
      fecha_clase: "",
    });
    setModalOpen(true);
  };

  const handleEditarClase = (clase: ClasePrueba): void => {
    setIsEditing(true);
    setClaseSeleccionada(clase);
    setFormData({
      idalumno: clase.idalumno,
      idhorario: clase.idhorario,
      fecha_clase: clase.fecha_clase,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!formData.idalumno || !formData.idhorario || !formData.fecha_clase) {
      showAlert("error", "Por favor completa todos los campos obligatorios");
      return;
    }

    setProcessing(true);

    try {
      const url = isEditing
        ? API_BASE + "clases_prueba.php?action=update"
        : API_BASE + "clases_prueba.php?action=create";

      const payload = isEditing
        ? { ...formData, idclase_prueba: claseSeleccionada?.idclase_prueba }
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
            ? "Clase de prueba actualizada correctamente"
            : "Clase de prueba creada correctamente"
        );
        setModalOpen(false);
        await fetchClasesPrueba();
      } else {
        showAlert("error", data.error ?? "Error al guardar");
      }
    } catch {
      showAlert("error", "Error de conexión");
    } finally {
      setProcessing(false);
    }
  };

  const handleAbrirDialogEstado = (clase: ClasePrueba): void => {
    setClaseParaAccion(clase);
    setDialogEstado(true);
  };

  const handleToggleEstado = async (): Promise<void> => {
    if (!claseParaAccion) return;

    setProcessing(true);
    try {
      const res = await fetch(
        API_BASE +
          `clases_prueba.php?action=toggleEstado&idclase_prueba=${claseParaAccion.idclase_prueba}`,
        { method: "POST" }
      );
      const data = await res.json();

      if (data.success) {
        showAlert(
          "success",
          `Clase de prueba marcada como ${data.estado.toLowerCase()} correctamente`
        );
        await fetchClasesPrueba();
      } else {
        showAlert("error", data.error ?? "Error al cambiar estado");
      }
    } catch {
      showAlert("error", "Error de conexión");
    } finally {
      setProcessing(false);
      setDialogEstado(false);
      setClaseParaAccion(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const clasesProgramadas = clasesPrueba.filter(
    (c) => c.estado === "Programada"
  );
  const clasesTomadas = clasesPrueba.filter((c) => c.estado === "Tomada");

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
            placeholder="Buscar por alumno o fecha..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 rounded-lg shadow-md"
          />
        </div>
        <Button
          onClick={handleNuevaClase}
          className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Nueva Clase de Prueba
        </Button>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as typeof tab)}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="programadas" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Programadas
          </TabsTrigger>
          <TabsTrigger value="tomadas" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Tomadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="programadas">
          <Table className="rounded-lg shadow-sm">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Alumno</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Deporte</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clasesProgramadas.length > 0 ? (
                clasesProgramadas.map((clase) => (
                  <TableRow key={clase.idclase_prueba}>
                    <TableCell>{clase.idclase_prueba}</TableCell>
                    <TableCell className="font-medium">
                      {clase.alumno_nombre || "Sin nombre"}
                    </TableCell>
                    <TableCell>
                      {clase.horario_descripcion || "Sin descripción"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor: clase.deporte_color || "#808080",
                          color: "#fff",
                        }}
                        className="shadow-sm"
                      >
                        {clase.deporte_nombre || "Sin deporte"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(clase.fecha_clase).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditarClase(clase)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAbrirDialogEstado(clase)}
                        >
                          <Power className="h-4 w-4 text-blue-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-gray-600 py-4"
                  >
                    No se encontraron clases programadas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="tomadas">
          <Table className="rounded-lg shadow-sm">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Alumno</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Deporte</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clasesTomadas.length > 0 ? (
                clasesTomadas.map((clase) => (
                  <TableRow key={clase.idclase_prueba}>
                    <TableCell>{clase.idclase_prueba}</TableCell>
                    <TableCell className="font-medium">
                      {clase.alumno_nombre || "Sin nombre"}
                    </TableCell>
                    <TableCell>
                      {clase.horario_descripcion || "Sin descripción"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor: clase.deporte_color || "#808080",
                          color: "#fff",
                        }}
                        className="shadow-sm"
                      >
                        {clase.deporte_nombre || "Sin deporte"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(clase.fecha_clase).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditarClase(clase)}
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAbrirDialogEstado(clase)}
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
                    colSpan={6}
                    className="text-center text-gray-600 py-4"
                  >
                    No hay clases tomadas.
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
              {isEditing ? "Editar Clase de Prueba" : "Nueva Clase de Prueba"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifica los datos de la clase"
                : "Completa los datos de la nueva clase de prueba"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>
                    Alumno <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={String(formData.idalumno)}
                    onValueChange={(value) =>
                      setFormData({ ...formData, idalumno: Number(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar alumno" />
                    </SelectTrigger>
                    <SelectContent>
                      {alumnos.map((alumno) => (
                        <SelectItem
                          key={alumno.idalumno}
                          value={String(alumno.idalumno)}
                        >
                          {alumno.nombre_completo} ({alumno.curp})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>
                    Horario <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={String(formData.idhorario)}
                    onValueChange={(value) =>
                      setFormData({ ...formData, idhorario: Number(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar horario" />
                    </SelectTrigger>
                    <SelectContent>
                      {horarios.map((horario) => (
                        <SelectItem
                          key={horario.idhorario}
                          value={String(horario.idhorario)}
                        >
                          {horario.descripcion ||
                            `Horario ${horario.idhorario}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>
                  Fecha de la Clase <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={formData.fecha_clase}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha_clase: e.target.value })
                    }
                    className="pl-10"
                    required
                  />
                </div>
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
              {claseParaAccion?.estado === "Programada"
                ? "Marcar como Tomada"
                : "Marcar como Programada"}{" "}
              Clase de Prueba
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas{" "}
              {claseParaAccion?.estado === "Programada"
                ? "marcar como tomada"
                : "marcar como programada"}{" "}
              la clase para {claseParaAccion?.alumno_nombre} en{" "}
              {claseParaAccion?.fecha_clase}?
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

export default ClasesPrueba;
