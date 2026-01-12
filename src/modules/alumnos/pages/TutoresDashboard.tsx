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
import { AlertCircle, CheckCircle2, Pencil, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE = "https://academiagymserra.garzas.store";

interface Tutor {
  idtutor: number;
  nombre_completo: string;
  curp: string;
  telefono: string;
  correo: string;
  estado_documentos: string;
}

interface Alumno {
  idalumno: number;
  idtutor?: number | null;
  nombre_tutor?: string | null;
  curp: string;
  nombre_completo: string;
  f_nacimiento: string;
  estado: string;
  estado_documentos: string;
  fecha_pago?: string | null;
  fecha_vencimiento?: string | null;
  // nuevo: indica si ya usó la clase de prueba
  tiene_clase_prueba?: boolean;
}

interface ListTutoresResponse {
  success?: boolean;
  tutores?: Tutor[];
  total?: number;
  error?: string;
}

interface ListAlumnosResponse {
  success?: boolean;
  alumnos?: Alumno[];
  total?: number;
  error?: string;
}

interface CrudResponse {
  success: boolean;
  error?: string;
  id?: number;
}

interface MensualidadHistorial {
  idmensualidad: number;
  fecha_pago: string | null;
  fecha_vencimiento: string | null;
  total_pagado: number;
  estado: string;
  deporte: string;
  plan: string;
}

type TipoRegistro = "alumno" | "cliente_alumno";
type TabKey = "tutores" | "alumnos" | "nuevos";

const TutoresDashboard: React.FC = () => {
  // --------- Estado Tutores ---------
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [totalTutores, setTotalTutores] = useState(0);
  const [pageTutores, setPageTutores] = useState(1);
  const [limitTutores] = useState(10);
  const [searchTutores, setSearchTutores] = useState("");

  // --------- Estado Alumnos ---------
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [totalAlumnos, setTotalAlumnos] = useState(0);
  const [pageAlumnos, setPageAlumnos] = useState(1);
  const [limitAlumnos] = useState(10);
  const [searchAlumnos, setSearchAlumnos] = useState("");

  const [historialOpen, setHistorialOpen] = useState(false);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [historialMensualidades, setHistorialMensualidades] = useState<
    MensualidadHistorial[]
  >([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<Alumno | null>(
    null
  );
  const [historialError, setHistorialError] = useState<string | null>(null);

  // --------- Alertas ---------
  const [alert, setAlert] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // --------- Loading Global ---------
  const [loading, setLoading] = useState(false);

  // --------- Estado edición tutor ---------
  const [editTutorDialogOpen, setEditTutorDialogOpen] = useState(false);
  const [tutorForm, setTutorForm] = useState<Tutor>({
    idtutor: 0,
    nombre_completo: "",
    curp: "",
    telefono: "",
    correo: "",
    estado_documentos: "Incompleto",
  });

  // --------- Wizard registro alumno+tutor ---------
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardRequiresTutor, setWizardRequiresTutor] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);

  const [nuevoTutor, setNuevoTutor] = useState({
    nombre_completo: "",
    curp: "",
    telefono: "",
    correo: "",
    estado_documentos: "Incompleto",
  });

  const [nuevoAlumno, setNuevoAlumno] = useState({
    nombre_completo: "",
    curp: "",
    f_nacimiento: "",
    estado: "Activo",
    estado_documentos: "Completo",
  });

  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistro>("alumno");

  // --------- Utilidades / validación de edad ----------
  const calcularEdad = (fecha: string): number | null => {
    if (!fecha) return null;
    const nacimiento = new Date(fecha);
    if (Number.isNaN(nacimiento.getTime())) return null;

    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const esMenorDeEdad = (fecha: string): boolean => {
    const edad = calcularEdad(fecha);
    return edad !== null && edad < 18;
  };

  // --------- Edición de alumno ---------
  const [alumnoDialogOpen, setAlumnoDialogOpen] = useState(false);
  const [alumnoForm, setAlumnoForm] = useState<Alumno>({
    idalumno: 0,
    idtutor: null,
    nombre_tutor: undefined,
    nombre_completo: "",
    curp: "",
    f_nacimiento: "",
    estado: "Activo",
    estado_documentos: "Completo",
  });

  const [agregarTutorEnAlumno, setAgregarTutorEnAlumno] = useState(false);
  const [nuevoTutorDesdeAlumno, setNuevoTutorDesdeAlumno] = useState({
    nombre_completo: "",
    curp: "",
    telefono: "",
    correo: "",
    estado_documentos: "Incompleto",
  });
  const [agregarTutorLoading, setAgregarTutorLoading] = useState(false);

  // --------- Tabs ---------
  const [activeTab, setActiveTab] = useState<TabKey>("tutores");

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert({ type: null, message: "" });
    }, 3000);
  };

  const fetchTutores = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/api/tutores.php?action=list&page=${pageTutores}&limit=${limitTutores}&search=${encodeURIComponent(
          searchTutores
        )}`
      );
      const data: ListTutoresResponse = await response.json();
      if (data.success === false) {
        showAlert("error", data.error || "Error al obtener tutores");
      } else if (data.tutores) {
        setTutores(data.tutores);
        setTotalTutores(data.total ?? data.tutores.length ?? 0);
      } else {
        setTutores([]);
        setTotalTutores(0);
      }
    } catch (error) {
      console.error(error);
      showAlert("error", "Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const fetchAlumnos = async (): Promise<void> => {
    try {
      const response = await fetch(
        `${API_BASE}/api/alumnos.php?action=list&page=${pageAlumnos}&limit=${limitAlumnos}&search=${encodeURIComponent(
          searchAlumnos
        )}`
      );
      const data: ListAlumnosResponse = await response.json();

      if (data && Array.isArray(data.alumnos)) {
        setAlumnos(data.alumnos);
        setTotalAlumnos(data.total ?? data.alumnos.length ?? 0);
      } else if (data.success === false) {
        showAlert("error", data.error || "Error al obtener alumnos");
      } else {
        setAlumnos([]);
        setTotalAlumnos(0);
      }
    } catch (error) {
      console.error(error);
      showAlert(
        "error",
        "Error de conexión con el servidor al obtener alumnos"
      );
    }
  };

  useEffect(() => {
    void fetchTutores();
  }, [pageTutores, limitTutores, searchTutores]);

  useEffect(() => {
    void fetchAlumnos();
  }, [pageAlumnos, limitAlumnos, searchAlumnos]);

  const handleSearchTutores = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setSearchTutores(event.target.value);
    setPageTutores(1);
  };

  const handleSearchAlumnos = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setSearchAlumnos(event.target.value);
    setPageAlumnos(1);
  };

  const resetTutorForm = (): void => {
    setTutorForm({
      idtutor: 0,
      nombre_completo: "",
      curp: "",
      telefono: "",
      correo: "",
      estado_documentos: "Incompleto",
    });
  };

  const handleEditTutor = (idtutor: number): void => {
    const tutor = tutores.find((t) => t.idtutor === idtutor);
    if (!tutor) return;
    setTutorForm(tutor);
    setEditTutorDialogOpen(true);
  };

  const handleSubmitTutor = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API_BASE}/api/tutores.php?action=update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tutorForm),
        }
      );
      const data: CrudResponse = await response.json();
      if (data.success) {
        showAlert("success", "Tutor actualizado correctamente");
        setEditTutorDialogOpen(false);
        resetTutorForm();
        void fetchTutores();
      } else {
        showAlert("error", data.error || "Error al actualizar tutor");
      }
    } catch (error) {
      console.error(error);
      showAlert("error", "Error de conexión con el servidor");
    }
  };

  const resetWizard = (): void => {
    setWizardStep(1);
    setWizardRequiresTutor(false);
    setWizardError(null);
    setNuevoTutor({
      nombre_completo: "",
      curp: "",
      telefono: "",
      correo: "",
      estado_documentos: "Incompleto",
    });
    setNuevoAlumno({
      nombre_completo: "",
      curp: "",
      f_nacimiento: "",
      estado: "Activo",
      estado_documentos: "Completo",
    });
    setTipoRegistro("alumno");
  };

  const handleWizardNext = (): void => {
    setWizardError(null);

    // Paso 1: datos del alumno
    if (wizardStep === 1) {
      if (
        !nuevoAlumno.nombre_completo.trim() ||
        !nuevoAlumno.curp.trim() ||
        !nuevoAlumno.f_nacimiento
      ) {
        setWizardError(
          "Completa nombre, CURP y fecha de nacimiento del alumno."
        );
        return;
      }

      const menor = esMenorDeEdad(nuevoAlumno.f_nacimiento);
      setWizardRequiresTutor(menor);
      setWizardStep(2);
      return;
    }

    // Paso 2: tutor (obligatorio si es menor)
    if (wizardStep === 2) {
      if (wizardRequiresTutor) {
        if (
          !nuevoTutor.nombre_completo.trim() ||
          !nuevoTutor.curp.trim() ||
          !nuevoTutor.telefono.trim() ||
          !nuevoTutor.correo.trim()
        ) {
          setWizardError(
            "El alumno es menor de edad, todos los datos del tutor son obligatorios."
          );
          return;
        }
      }
      setWizardStep(3);
    }
  };

  const handleWizardFinish = async (): Promise<void> => {
    // Validaciones finales antes de llamar a la API
    if (
      !nuevoAlumno.nombre_completo.trim() ||
      !nuevoAlumno.curp.trim() ||
      !nuevoAlumno.f_nacimiento
    ) {
      setWizardError("Completa nombre, CURP y fecha de nacimiento del alumno.");
      return;
    }

    const menor = esMenorDeEdad(nuevoAlumno.f_nacimiento);
    const hayDatosTutor =
      nuevoTutor.nombre_completo.trim() ||
      nuevoTutor.curp.trim() ||
      nuevoTutor.telefono.trim() ||
      nuevoTutor.correo.trim();

    if (menor && !hayDatosTutor) {
      setWizardError("El alumno es menor de edad, debes registrar un tutor.");
      return;
    }

    if (menor || hayDatosTutor) {
      if (
        !nuevoTutor.nombre_completo.trim() ||
        !nuevoTutor.curp.trim() ||
        !nuevoTutor.telefono.trim() ||
        !nuevoTutor.correo.trim()
      ) {
        setWizardError("Completa todos los campos del tutor.");
        return;
      }
    }

    // --- Validación para evitar alumnos duplicados (por CURP) ---
    const curpTrimmed = nuevoAlumno.curp.trim();
    try {
      const dupRes = await fetch(
        `${API_BASE}/api/alumnos.php?action=list&page=1&limit=5&search=${encodeURIComponent(
          curpTrimmed
        )}`
      );
      const dupData: ListAlumnosResponse = await dupRes.json();
      if (
        dupData.alumnos &&
        dupData.alumnos.some(
          (a) => a.curp.toLowerCase() === curpTrimmed.toLowerCase()
        )
      ) {
        setWizardError(
          "Ya existe un alumno registrado con esta CURP. Verifica antes de continuar."
        );
        return;
      }
    } catch (error) {
      console.error(error);
      setWizardError(
        "No se pudo verificar si el alumno ya existe. Intenta nuevamente."
      );
      return;
    }

    setWizardLoading(true);
    setWizardError(null);

    try {
      let idtutor: number | null = null;

      // Si es menor o el usuario quiso capturar tutor (mayor con tutor opcional)
      if (menor || hayDatosTutor) {
        const resTutor = await fetch(
          `${API_BASE}/api/tutores.php?action=create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoTutor),
          }
        );
        const dataTutor: CrudResponse = await resTutor.json();
        if (!dataTutor.success || !dataTutor.id) {
          showAlert("error", dataTutor.error || "No se pudo crear el tutor");
          return;
        }
        idtutor = dataTutor.id;
      }

      const alumnoPayload = {
        ...nuevoAlumno,
        idtutor,
        tipo_registro: tipoRegistro,
      };

      const resAlumno = await fetch(
        `${API_BASE}/api/alumnos.php?action=create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(alumnoPayload),
        }
      );
      const dataAlumno: { success?: boolean; error?: string } =
        await resAlumno.json();
      if (dataAlumno.success === false) {
        showAlert("error", dataAlumno.error || "No se pudo crear el alumno");
        return;
      }

      showAlert("success", "Registro guardado correctamente");
      setWizardOpen(false);
      resetWizard();
      void fetchTutores();
      void fetchAlumnos();
      setActiveTab("alumnos");
    } catch (error) {
      console.error(error);
      showAlert("error", "Error de conexión con el servidor");
    } finally {
      setWizardLoading(false);
    }
  };

  const alumnosConMensualidad = alumnos.filter(
    (alumno) =>
      alumno.fecha_pago !== null &&
      alumno.fecha_pago !== undefined &&
      alumno.fecha_pago !== ""
  );

  const nuevosAlumnos = alumnos.filter(
    (alumno) =>
      alumno.fecha_pago === null ||
      alumno.fecha_pago === undefined ||
      alumno.fecha_pago === ""
  );

  const resetAlumnoForm = (): void => {
    setAlumnoForm({
      idalumno: 0,
      idtutor: null,
      nombre_tutor: undefined,
      nombre_completo: "",
      curp: "",
      f_nacimiento: "",
      estado: "Activo",
      estado_documentos: "Completo",
    });
    setAgregarTutorEnAlumno(false);
    setNuevoTutorDesdeAlumno({
      nombre_completo: "",
      curp: "",
      telefono: "",
      correo: "",
      estado_documentos: "Incompleto",
    });
  };

  const handleEditAlumno = (alumno: Alumno): void => {
    setAlumnoForm({
      idalumno: alumno.idalumno,
      idtutor: alumno.idtutor ?? null,
      nombre_tutor: alumno.nombre_tutor,
      nombre_completo: alumno.nombre_completo,
      curp: alumno.curp,
      f_nacimiento: alumno.f_nacimiento,
      estado: alumno.estado,
      estado_documentos: alumno.estado_documentos,
      fecha_pago: alumno.fecha_pago,
      fecha_vencimiento: alumno.fecha_vencimiento,
      tiene_clase_prueba: alumno.tiene_clase_prueba,
    });
    setAgregarTutorEnAlumno(false);
    setNuevoTutorDesdeAlumno({
      nombre_completo: "",
      curp: "",
      telefono: "",
      correo: "",
      estado_documentos: "Incompleto",
    });
    setAlumnoDialogOpen(true);
  };

  const handleSubmitAlumno = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    // Si estoy agregando un tutor nuevo a un alumno que no tiene tutor
    if (
      agregarTutorEnAlumno &&
      (!alumnoForm.idtutor || alumnoForm.idtutor === null)
    ) {
      const { nombre_completo, curp, telefono, correo } = nuevoTutorDesdeAlumno;

      if (
        !nombre_completo.trim() ||
        !curp.trim() ||
        !telefono.trim() ||
        !correo.trim()
      ) {
        showAlert(
          "error",
          "Completa todos los campos del tutor antes de guardar."
        );
        return;
      }

      setAgregarTutorLoading(true);

      try {
        // 1) Crear tutor
        const resTutor = await fetch(
          `${API_BASE}/api/tutores.php?action=create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoTutorDesdeAlumno),
          }
        );
        const dataTutor: CrudResponse = await resTutor.json();

        if (!dataTutor.success || !dataTutor.id) {
          showAlert("error", dataTutor.error || "No se pudo crear el tutor");
          return;
        }

        const idtutor = dataTutor.id;

        // 2) Actualizar alumno con idtutor
        const response = await fetch(
          `${API_BASE}/api/alumnos.php?action=update`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...alumnoForm,
              idtutor,
            }),
          }
        );
        const data: CrudResponse = await response.json();
        if (data.success) {
          showAlert("success", "Alumno y tutor actualizados correctamente");
          setAlumnoDialogOpen(false);
          resetAlumnoForm();
          void fetchAlumnos();
          void fetchTutores();
        } else {
          showAlert("error", data.error || "Error al actualizar alumno");
        }
      } catch (error) {
        console.error(error);
        showAlert("error", "Error de conexión con el servidor");
      } finally {
        setAgregarTutorLoading(false);
      }

      return;
    }

    // Flujo normal: solo actualizar datos del alumno
    try {
      const response = await fetch(
        `${API_BASE}/api/alumnos.php?action=update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(alumnoForm),
        }
      );
      const data: CrudResponse = await response.json();
      if (data.success) {
        showAlert("success", "Alumno actualizado correctamente");
        setAlumnoDialogOpen(false);
        resetAlumnoForm();
        void fetchAlumnos();
      } else {
        showAlert("error", data.error || "Error al actualizar alumno");
      }
    } catch (error) {
      console.error(error);
      showAlert("error", "Error de conexión con el servidor");
    }
  };

  // --------- Ver historial de mensualidades (modal) ---------
  const handleVerHistorialMensualidades = async (
    alumno: Alumno
  ): Promise<void> => {
    setAlumnoSeleccionado(alumno);
    setHistorialOpen(true);
    setHistorialLoading(true);
    setHistorialError(null);
    setHistorialMensualidades([]);

    try {
      const response = await fetch(
        `${API_BASE}/api/alumnos.php?action=mensualidades&idalumno=${alumno.idalumno}`
      );
      const data = await response.json();

      if (!data.success) {
        setHistorialError(
          data.error || "Error al obtener el historial de mensualidades."
        );
        return;
      }

      setHistorialMensualidades(data.mensualidades ?? []);
    } catch (error) {
      console.error(error);
      setHistorialError("Error de conexión con el servidor.");
    } finally {
      setHistorialLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Gestión de Tutores y Alumnos
            </h1>
            <p className="text-sm text-gray-600">
              Administra tutores, alumnos y sus registros.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="bg-gray-900 text-white hover:bg-gray-800 rounded-lg px-4"
              onClick={() => {
                resetWizard();
                setWizardOpen(true);
              }}
            >
              Nueva inscripción
            </Button>
          </div>
        </div>

        {alert.type && (
          <Alert
            className={`border ${
              alert.type === "success"
                ? "border-green-500 bg-green-50"
                : "border-red-500 bg-red-50"
            }`}
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              {alert.type === "success" ? "Éxito" : "Error"}
            </AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabKey)}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="tutores">Tutores</TabsTrigger>
          <TabsTrigger value="alumnos">Alumnos</TabsTrigger>
          <TabsTrigger value="nuevos">Nuevos alumnos</TabsTrigger>
        </TabsList>

        {/* TAB TUTORES */}
        <TabsContent value="tutores">
          <div className="flex justify-between mb-4">
            <Input
              placeholder="Buscar tutor por nombre, CURP o correo..."
              value={searchTutores}
              onChange={handleSearchTutores}
              className="max-w-sm rounded-lg shadow-md"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>CURP</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Documentos</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tutores.map((tutor) => (
                <TableRow key={tutor.idtutor}>
                  <TableCell>{tutor.idtutor}</TableCell>
                  <TableCell>{tutor.nombre_completo}</TableCell>
                  <TableCell>{tutor.curp}</TableCell>
                  <TableCell>{tutor.telefono}</TableCell>
                  <TableCell>{tutor.correo}</TableCell>
                  <TableCell>{tutor.estado_documentos}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditTutor(tutor.idtutor)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {tutores.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm">
                    No hay tutores registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex justify-between mt-4">
            <Button
              disabled={pageTutores === 1}
              onClick={() => setPageTutores((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span>
              Página {pageTutores} de{" "}
              {Math.max(1, Math.ceil(totalTutores / limitTutores))}
            </span>
            <Button
              disabled={pageTutores * limitTutores >= totalTutores}
              onClick={() => setPageTutores((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </TabsContent>

        {/* TAB ALUMNOS (con fecha de pago) */}
        <TabsContent value="alumnos">
          <div className="flex justify-between mb-4">
            <Input
              placeholder="Buscar alumno por nombre o CURP..."
              value={searchAlumnos}
              onChange={handleSearchAlumnos}
              className="max-w-sm rounded-lg shadow-md"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>CURP</TableHead>
                <TableHead>Tutor</TableHead>
                <TableHead>Nacimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Documentos</TableHead>
                <TableHead>Fecha pago</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alumnosConMensualidad.map((alumno) => (
                <TableRow key={alumno.idalumno}>
                  <TableCell>{alumno.idalumno}</TableCell>
                  <TableCell>{alumno.nombre_completo}</TableCell>
                  <TableCell>{alumno.curp}</TableCell>
                  <TableCell>
                    {alumno.nombre_tutor
                      ? alumno.nombre_tutor
                      : alumno.idtutor
                      ? `Tutor #${alumno.idtutor}`
                      : "Sin tutor"}
                  </TableCell>
                  <TableCell>{alumno.f_nacimiento}</TableCell>
                  <TableCell>{alumno.estado}</TableCell>
                  <TableCell>{alumno.estado_documentos}</TableCell>
                  <TableCell>{alumno.fecha_pago || "-"}</TableCell>
                  <TableCell>{alumno.fecha_vencimiento || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Ver historial de mensualidades"
                        onClick={() =>
                          void handleVerHistorialMensualidades(alumno)
                        }
                      >
                        <History className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditAlumno(alumno)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {alumnosConMensualidad.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-sm">
                    No hay alumnos con mensualidades registradas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex justify-between mt-4">
            <Button
              disabled={pageAlumnos === 1}
              onClick={() => setPageAlumnos((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span>
              Página {pageAlumnos} de{" "}
              {Math.max(1, Math.ceil(totalAlumnos / limitAlumnos))}
            </span>
            <Button
              disabled={pageAlumnos * limitAlumnos >= totalAlumnos}
              onClick={() => setPageAlumnos((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </TabsContent>

        {/* TAB NUEVOS ALUMNOS (sin fecha de pago) */}
        <TabsContent value="nuevos">
          <p className="text-sm text-gray-600 mb-4">
            Nuevos alumnos: aquellos sin registros de mensualidad.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>CURP</TableHead>
                <TableHead>Tutor</TableHead>
                <TableHead>Nacimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Documentos</TableHead>
                <TableHead>Clase de prueba</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nuevosAlumnos.map((alumno) => (
                <TableRow key={alumno.idalumno}>
                  <TableCell>{alumno.idalumno}</TableCell>
                  <TableCell>{alumno.nombre_completo}</TableCell>
                  <TableCell>{alumno.curp}</TableCell>
                  <TableCell>
                    {alumno.nombre_tutor
                      ? alumno.nombre_tutor
                      : alumno.idtutor
                      ? `Tutor #${alumno.idtutor}`
                      : "Sin tutor"}
                  </TableCell>
                  <TableCell>{alumno.f_nacimiento}</TableCell>
                  <TableCell>{alumno.estado}</TableCell>
                  <TableCell>{alumno.estado_documentos}</TableCell>
                  <TableCell>
                    {alumno.tiene_clase_prueba
                      ? "Clase de prueba usada"
                      : "Disponible"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditAlumno(alumno)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {nuevosAlumnos.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm">
                    No hay nuevos alumnos sin mensualidad.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {/* Paginación también para nuevos alumnos */}
          <div className="flex justify-between mt-4">
            <Button
              disabled={pageAlumnos === 1}
              onClick={() => setPageAlumnos((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span>
              Página {pageAlumnos} de{" "}
              {Math.max(1, Math.ceil(totalAlumnos / limitAlumnos))}
            </span>
            <Button
              disabled={pageAlumnos * limitAlumnos >= totalAlumnos}
              onClick={() => setPageAlumnos((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog wizard nueva inscripción */}
      <Dialog
        open={wizardOpen}
        onOpenChange={(open) => {
          setWizardOpen(open);
          if (!open) resetWizard();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva inscripción</DialogTitle>
            <div className="flex items-center justify-between">
              {/* Paso 1: Alumno */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span
                  className={`h-7 w-7 flex items-center justify-center rounded-full text-xs font-semibold ${
                    wizardStep === 1
                      ? "bg-gray-200 text-gray-800"
                      : "bg-gray-900 text-white"
                  }`}
                >
                  1
                </span>
                <span>Alumno</span>
              </div>
              <div className="flex-1 h-px bg-gray-200 mx-2" />
              {/* Paso 2: Tutor */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span
                  className={`h-7 w-7 flex items-center justify-center rounded-full text-xs font-semibold ${
                    wizardStep === 2
                      ? "bg-gray-200 text-gray-800"
                      : "bg-gray-900 text-white"
                  }`}
                >
                  2
                </span>
                <span>Tutor</span>
              </div>
              <div className="flex-1 h-px bg-gray-200 mx-2" />
              {/* Paso 3: Tipo de registro */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span
                  className={`h-7 w-7 flex items-center justify-center rounded-full text-xs font-semibold ${
                    wizardStep === 3
                      ? "bg-gray-200 text-gray-800"
                      : "bg-gray-900 text-white"
                  }`}
                >
                  3
                </span>
                <span>Tipo de registro</span>
              </div>
            </div>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna izquierda: pasos */}
            <div className="space-y-4">
              {/* Indicador de pasos */}

              {/* STEP 1: Alumno */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label>Nombre completo del alumno</Label>
                    <Input
                      value={nuevoAlumno.nombre_completo}
                      onChange={(e) =>
                        setNuevoAlumno({
                          ...nuevoAlumno,
                          nombre_completo: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>CURP del alumno</Label>
                    <Input
                      value={nuevoAlumno.curp}
                      onChange={(e) =>
                        setNuevoAlumno({
                          ...nuevoAlumno,
                          curp: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Fecha de nacimiento</Label>
                    <Input
                      type="date"
                      value={nuevoAlumno.f_nacimiento}
                      onChange={(e) =>
                        setNuevoAlumno({
                          ...nuevoAlumno,
                          f_nacimiento: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Select
                      value={nuevoAlumno.estado}
                      onValueChange={(value: string) =>
                        setNuevoAlumno({
                          ...nuevoAlumno,
                          estado: value,
                        })
                      }
                    >
                      <SelectTrigger className="rounded-lg shadow-sm">
                        <SelectValue placeholder="Selecciona estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Estado de documentos</Label>
                    <Select
                      value={nuevoAlumno.estado_documentos}
                      onValueChange={(value: string) =>
                        setNuevoAlumno({
                          ...nuevoAlumno,
                          estado_documentos: value,
                        })
                      }
                    >
                      <SelectTrigger className="rounded-lg shadow-sm">
                        <SelectValue placeholder="Selecciona estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Completo">Completo</SelectItem>
                        <SelectItem value="Incompleto">Incompleto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* STEP 2: Tutor (obligatorio solo si es menor) */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-300">
                    {wizardRequiresTutor
                      ? "El alumno es menor de edad. Debes registrar un tutor."
                      : "El alumno es mayor de edad. El tutor es opcional."}
                  </p>
                  <div>
                    <Label>Nombre completo del tutor</Label>
                    <Input
                      value={nuevoTutor.nombre_completo}
                      onChange={(e) =>
                        setNuevoTutor({
                          ...nuevoTutor,
                          nombre_completo: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>CURP del tutor</Label>
                    <Input
                      value={nuevoTutor.curp}
                      onChange={(e) =>
                        setNuevoTutor({
                          ...nuevoTutor,
                          curp: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <Input
                      value={nuevoTutor.telefono}
                      onChange={(e) =>
                        setNuevoTutor({
                          ...nuevoTutor,
                          telefono: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Correo</Label>
                    <Input
                      type="email"
                      value={nuevoTutor.correo}
                      onChange={(e) =>
                        setNuevoTutor({
                          ...nuevoTutor,
                          correo: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Estado de documentos</Label>
                    <Select
                      value={nuevoTutor.estado_documentos}
                      onValueChange={(value: string) =>
                        setNuevoTutor({
                          ...nuevoTutor,
                          estado_documentos: value,
                        })
                      }
                    >
                      <SelectTrigger className="rounded-lg shadow-sm">
                        <SelectValue placeholder="Selecciona estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Completo">Completo</SelectItem>
                        <SelectItem value="Incompleto">Incompleto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* STEP 3: Tipo de registro */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-300">
                    Elige si el alumno también será registrado como cliente para
                    el módulo de ventas.
                  </p>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant={
                        tipoRegistro === "alumno" ? "default" : "outline"
                      }
                      className={`w-full justify-start rounded-lg ${
                        tipoRegistro === "alumno"
                          ? "bg-white text-gray-900 hover:bg-gray-50"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      }`}
                      onClick={() => setTipoRegistro("alumno")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-900 text-white flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">Solo alumno</div>
                        </div>
                      </div>
                    </Button>

                    <Button
                      type="button"
                      variant={
                        tipoRegistro === "cliente_alumno"
                          ? "default"
                          : "outline"
                      }
                      className={`w-full justify-start rounded-lg ${
                        tipoRegistro === "cliente_alumno"
                          ? "bg-white text-gray-900 hover:bg-gray-50"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      }`}
                      onClick={() => setTipoRegistro("cliente_alumno")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-900 text-white flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">Alumno y cliente</div>
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Columna derecha: resumen */}
            <div className="border rounded-xl p-4 bg-accent space-y-4">
              <h3 className="font-semibold mb-2">Resumen</h3>
              <div className="text-sm space-y-1">
                <p className="font-semibold">Alumno</p>
                <p>{nuevoAlumno.nombre_completo || "Sin nombre"}</p>
                <p>CURP: {nuevoAlumno.curp || "Sin CURP"}</p>
                <p>
                  Nacimiento:{" "}
                  {nuevoAlumno.f_nacimiento || "Sin fecha de nacimiento"}
                </p>
                <p>Estado: {nuevoAlumno.estado}</p>
                <p>Documentos: {nuevoAlumno.estado_documentos}</p>
              </div>

              <div className="text-sm space-y-1 border-t pt-3">
                <p className="font-semibold">Tutor</p>
                <p>{nuevoTutor.nombre_completo || "Sin nombre"}</p>
                <p>CURP: {nuevoTutor.curp || "Sin CURP"}</p>
                <p>Teléfono: {nuevoTutor.telefono || "Sin teléfono"}</p>
                <p>Correo: {nuevoTutor.correo || "Sin correo"}</p>
                <p>Documentos: {nuevoTutor.estado_documentos}</p>
              </div>

              <div className="text-sm space-y-1 border-t pt-3">
                <p className="font-semibold">Tipo de registro</p>
                <p>
                  {tipoRegistro === "alumno"
                    ? "Solo alumno (módulo escolar)"
                    : "Alumno y cliente (módulo de ventas)"}
                </p>
              </div>

              <div className="flex justify-between items-center border-t mt-4 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={wizardStep === 1 || wizardLoading}
                  onClick={() => setWizardStep((s) => (s > 1 ? s - 1 : s))}
                >
                  Anterior
                </Button>
                <div className="flex gap-2">
                  {wizardStep < 3 && (
                    <Button
                      type="button"
                      className="bg-gray-800 hover:bg-gray-700 text-white"
                      disabled={wizardLoading}
                      onClick={handleWizardNext}
                    >
                      Siguiente
                    </Button>
                  )}
                  {wizardStep === 3 && (
                    <Button
                      type="button"
                      className="bg-gray-900 text-white hover:bg-gray-800"
                      disabled={wizardLoading}
                      onClick={() => void handleWizardFinish()}
                    >
                      {wizardLoading ? "Guardando..." : "Finalizar"}
                    </Button>
                  )}
                </div>
              </div>
              {wizardError && (
                <p className="mt-3 text-sm text-red-200">{wizardError}</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog historial de mensualidades */}
      <Dialog
        open={historialOpen}
        onOpenChange={(open) => {
          setHistorialOpen(open);
          if (!open) {
            setHistorialMensualidades([]);
            setAlumnoSeleccionado(null);
            setHistorialError(null);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Historial de mensualidades
              {alumnoSeleccionado
                ? ` - ${alumnoSeleccionado.nombre_completo}`
                : ""}
            </DialogTitle>
          </DialogHeader>

          {historialLoading ? (
            <p className="text-sm text-gray-600">Cargando historial...</p>
          ) : historialError ? (
            <p className="text-sm text-red-500">{historialError}</p>
          ) : historialMensualidades.length === 0 ? (
            <p className="text-sm text-gray-600">
              Este alumno no tiene mensualidades registradas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha pago</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Deporte / Plan</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historialMensualidades.map((m) => (
                  <TableRow key={m.idmensualidad}>
                    <TableCell>{m.fecha_pago ?? "-"}</TableCell>
                    <TableCell>{m.fecha_vencimiento ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{m.deporte}</span>
                        <span className="text-xs text-gray-500">{m.plan}</span>
                      </div>
                    </TableCell>
                    <TableCell>${m.total_pagado.toFixed(2)}</TableCell>
                    <TableCell>{m.estado}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog edición tutor */}
      <Dialog
        open={editTutorDialogOpen}
        onOpenChange={(open) => {
          setEditTutorDialogOpen(open);
          if (!open) resetTutorForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Tutor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitTutor} className="space-y-4">
            <div>
              <Label>Nombre completo</Label>
              <Input
                value={tutorForm.nombre_completo}
                onChange={(e) =>
                  setTutorForm({
                    ...tutorForm,
                    nombre_completo: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <Label>CURP</Label>
              <Input
                value={tutorForm.curp}
                onChange={(e) =>
                  setTutorForm({ ...tutorForm, curp: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={tutorForm.telefono}
                onChange={(e) =>
                  setTutorForm({ ...tutorForm, telefono: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label>Correo</Label>
              <Input
                type="email"
                value={tutorForm.correo}
                onChange={(e) =>
                  setTutorForm({ ...tutorForm, correo: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label>Estado de documentos</Label>
              <Select
                value={tutorForm.estado_documentos}
                onValueChange={(value: string) =>
                  setTutorForm({
                    ...tutorForm,
                    estado_documentos: value,
                  })
                }
              >
                <SelectTrigger className="rounded-lg shadow-sm">
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completo">Completo</SelectItem>
                  <SelectItem value="Incompleto">Incompleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full bg-gray-800 text-white hover:bg-gray-700 rounded-lg"
            >
              Guardar cambios
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog edición alumno */}
      <Dialog
        open={alumnoDialogOpen}
        onOpenChange={(open) => {
          setAlumnoDialogOpen(open);
          if (!open) resetAlumnoForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Alumno</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitAlumno} className="space-y-4">
            <div>
              <Label>Nombre completo</Label>
              <Input
                value={alumnoForm.nombre_completo}
                onChange={(e) =>
                  setAlumnoForm({
                    ...alumnoForm,
                    nombre_completo: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <Label>CURP</Label>
              <Input
                value={alumnoForm.curp}
                onChange={(e) =>
                  setAlumnoForm({ ...alumnoForm, curp: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label>Fecha de nacimiento</Label>
              <Input
                type="date"
                value={alumnoForm.f_nacimiento}
                onChange={(e) =>
                  setAlumnoForm({
                    ...alumnoForm,
                    f_nacimiento: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select
                value={alumnoForm.estado}
                onValueChange={(value: string) =>
                  setAlumnoForm({ ...alumnoForm, estado: value })
                }
              >
                <SelectTrigger className="rounded-lg shadow-sm">
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado de documentos</Label>
              <Select
                value={alumnoForm.estado_documentos}
                onValueChange={(value: string) =>
                  setAlumnoForm({
                    ...alumnoForm,
                    estado_documentos: value,
                  })
                }
              >
                <SelectTrigger className="rounded-lg shadow-sm">
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completo">Completo</SelectItem>
                  <SelectItem value="Incompleto">Incompleto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {alumnoForm.idtutor ? (
              <p className="pt-2 text-sm text-gray-600">
                Tutor actual:{" "}
                {alumnoForm.nombre_tutor
                  ? alumnoForm.nombre_tutor
                  : `ID ${alumnoForm.idtutor}`}
              </p>
            ) : (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  Este alumno no tiene tutor asignado.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAgregarTutorEnAlumno((prev) => !prev)}
                >
                  {agregarTutorEnAlumno ? "Cancelar tutor" : "Agregar tutor"}
                </Button>

                {agregarTutorEnAlumno && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <Label>Nombre completo del tutor</Label>
                      <Input
                        value={nuevoTutorDesdeAlumno.nombre_completo}
                        onChange={(e) =>
                          setNuevoTutorDesdeAlumno({
                            ...nuevoTutorDesdeAlumno,
                            nombre_completo: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>CURP del tutor</Label>
                      <Input
                        value={nuevoTutorDesdeAlumno.curp}
                        onChange={(e) =>
                          setNuevoTutorDesdeAlumno({
                            ...nuevoTutorDesdeAlumno,
                            curp: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Teléfono</Label>
                      <Input
                        value={nuevoTutorDesdeAlumno.telefono}
                        onChange={(e) =>
                          setNuevoTutorDesdeAlumno({
                            ...nuevoTutorDesdeAlumno,
                            telefono: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Correo</Label>
                      <Input
                        type="email"
                        value={nuevoTutorDesdeAlumno.correo}
                        onChange={(e) =>
                          setNuevoTutorDesdeAlumno({
                            ...nuevoTutorDesdeAlumno,
                            correo: e.target.value,
                          })
                        }
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Al guardar se creará el tutor y se asociará a este alumno.
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gray-800 text-white hover:bg-gray-700 rounded-lg"
              disabled={agregarTutorLoading}
            >
              {agregarTutorLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TutoresDashboard;
