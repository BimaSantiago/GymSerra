import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import type {
  EventApi,
  EventClickArg,
  EventMountArg,
} from "@fullcalendar/core";
import esLocale from "@fullcalendar/core/locales/es";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  CalendarPlus,
  CheckCircle2,
  Trash2,
  Pencil,
} from "lucide-react";

/* ---------- Tipos ---------- */
interface Evento {
  idevento: number;
  fecha_inicio: string;
  fecha_fin: string;
  ubicacion: string;
  iddeporte: number;
  deporte?: string;
}

interface Deporte {
  iddeporte: number;
  nombre: string;
}

/* ---------- Utilidades ---------- */
const startOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
};

const hasEventEnded = (fcEvent: EventApi): boolean => {
  const end = fcEvent.end ?? fcEvent.start;
  if (!end) return false;
  if (fcEvent.allDay) return end.getTime() <= startOfToday().getTime();
  return end.getTime() < Date.now();
};

const colorHexByDeporte = (nombre?: string): string => {
  const n = (nombre ?? "").toLowerCase();
  if (n.includes("parkour")) return "#16a34a";
  if (n.includes("gimnasia")) return "#ec4899";
  if (n.includes("crossfit")) return "#f59e0b";
  return "#6b7280";
};

/* ---------- Componente principal ---------- */
const EventDashboard: React.FC = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [form, setForm] = useState({
    fecha_inicio: "",
    fecha_fin: "",
    ubicacion: "",
    iddeporte: "",
  });

  /* ---------- Alert auto dismiss ---------- */
  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), 3000);
    return () => clearTimeout(t);
  }, [alert]);

  /* ---------- Carga de datos ---------- */
  useEffect(() => {
    void fetchEventos();
    void fetchDeportes();
  }, []);

  const fetchEventos = async (): Promise<void> => {
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/eventos.php?action=list"
      );
      const data = await res.json();
      if (data.success) setEventos(data.eventos);
    } catch {
      /* noop */
    }
  };

  const fetchDeportes = async (): Promise<void> => {
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/deportes.php?action=list"
      );
      const data = await res.json();
      if (data.success) setDeportes(data.deportes);
    } catch {
      /* noop */
    }
  };

  /* ---------- Mapa id->evento ---------- */
  const eventosById = useMemo(() => {
    const m = new Map<string, Evento>();
    for (const ev of eventos) m.set(String(ev.idevento), ev);
    return m;
  }, [eventos]);

  /* ---------- CRUD ---------- */
  const handleSave = async (): Promise<void> => {
    if (
      !form.fecha_inicio ||
      !form.fecha_fin ||
      !form.ubicacion ||
      !form.iddeporte
    ) {
      setAlert({
        type: "error",
        message: "Todos los campos son obligatorios.",
      });
      return;
    }

    const action = selectedEvent ? "update" : "create";
    const body = { ...form, idevento: selectedEvent?.idevento ?? null };

    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/eventos.php?action=${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (data.success) {
        setAlert({
          type: "success",
          message: data.message || "Evento guardado correctamente.",
        });
        setOpenForm(false);
        setSelectedEvent(null);
        await fetchEventos();
      } else {
        setAlert({
          type: "error",
          message: data.error || "Error al guardar el evento.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Error de conexión con el servidor.",
      });
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!selectedEvent) return;
    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/eventos.php?action=delete&idevento=${selectedEvent.idevento}`
      );
      const data = await res.json();
      if (data.success) {
        setAlert({
          type: "success",
          message: "Evento eliminado correctamente.",
        });
        setOpenConfirmDelete(false);
        setOpenDetails(false);
        await fetchEventos();
      } else {
        setAlert({
          type: "error",
          message: data.error || "Error al eliminar el evento.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Error de conexión con el servidor.",
      });
    }
  };

  /* ---------- Calendario ---------- */
  const handleDateClick = (arg: DateClickArg): void => {
    setSelectedEvent(null);
    setForm({
      fecha_inicio: arg.dateStr,
      fecha_fin: arg.dateStr,
      ubicacion: "",
      iddeporte: "",
    });
    setOpenForm(true);
  };

  const handleEventClick = (info: EventClickArg): void => {
    const ev = eventosById.get(info.event.id);
    if (!ev) return;
    setSelectedEvent(ev);
    setOpenDetails(true);
  };

  const clickHandlersRef = useRef<
    WeakMap<HTMLElement, (e: MouseEvent) => void>
  >(new WeakMap());

  const onEventDidMount = useCallback(
    (arg: EventMountArg) => {
      const el: HTMLElement = arg.el;
      const map = clickHandlersRef.current;
      const prev = map.get(el);
      if (prev) el.removeEventListener("click", prev);

      const handler = (e: MouseEvent) => {
        e.stopPropagation();
        const ev = eventosById.get(arg.event.id);
        if (!ev) return;
        setSelectedEvent(ev);
        setOpenDetails(true);
      };
      map.set(el, handler);
      el.addEventListener("click", handler, { passive: true });

      // Tachado visual, no altera fechas
      const ended = hasEventEnded(arg.event);
      if (ended) {
        el.classList.add("line-through", "opacity-60");
      } else {
        el.classList.remove("line-through", "opacity-60");
      }
    },
    [eventosById]
  );

  const eventObjFrom = (e: Evento) => {
    const color = colorHexByDeporte(e.deporte);
    return {
      id: String(e.idevento),
      title: `${e.deporte ?? ""} • ${e.ubicacion}`,
      start: e.fecha_inicio,
      end: e.fecha_fin,
      backgroundColor: color,
      borderColor: color,
      textColor: "#fff",
      classNames: [
        "rounded-md",
        "px-1.5",
        "py-0.5",
        "text-[11px]",
        "font-medium",
        "shadow-sm",
        "cursor-pointer",
      ],
    };
  };

  /* ---------- Render ---------- */
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          Calendario de eventos
        </h2>
        <Button
          onClick={() => {
            const today = new Date().toISOString().split("T")[0];
            setForm({
              fecha_inicio: today,
              fecha_fin: today,
              ubicacion: "",
              iddeporte: "",
            });
            setSelectedEvent(null);
            setOpenForm(true);
          }}
          className="bg-gray-800 text-white hover:bg-gray-700 rounded-lg shadow-sm flex items-center gap-2"
        >
          <CalendarPlus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {/* Alertas */}
      {alert && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="border border-gray-200 bg-gray-50 shadow-sm rounded-md"
        >
          {alert.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertTitle className="text-sm font-medium text-gray-800">
            {alert.type === "success" ? "Éxito" : "Error"}
          </AlertTitle>
          <AlertDescription className="text-gray-600 text-sm">
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Calendario */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={esLocale}
          height="auto"
          selectable
          dayMaxEventRows={3}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDidMount={onEventDidMount}
          events={eventos.map(eventObjFrom)}
        />
      </div>

      {/* Leyenda */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Leyenda</h3>
        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-green-600 border border-black/10" />{" "}
            Parkour
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-pink-500 border border-black/10" />{" "}
            Gimnasia
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-amber-500 border border-black/10" />{" "}
            Crossfit
          </span>
        </div>
      </div>

      {/* Dialog Detalles */}
      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent className="sm:max-w-[420px] border border-gray-200 shadow-sm bg-white rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-800">
              Detalles del evento
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>Deporte:</strong> {selectedEvent.deporte}
              </p>
              <p>
                <strong>Comentario:</strong> {selectedEvent.ubicacion}
              </p>
              <p>
                <strong>Inicio:</strong> {selectedEvent.fecha_inicio}
              </p>
              <p>
                <strong>Fin:</strong> {selectedEvent.fecha_fin}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="destructive"
              onClick={() => setOpenConfirmDelete(true)}
              className="h-8 text-sm"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Borrar
            </Button>
            <Button
              onClick={() => {
                if (selectedEvent) {
                  setForm({
                    fecha_inicio: selectedEvent.fecha_inicio,
                    fecha_fin: selectedEvent.fecha_fin,
                    ubicacion: selectedEvent.ubicacion,
                    iddeporte: String(selectedEvent.iddeporte),
                  });
                  setOpenDetails(false);
                  setOpenForm(true);
                }
              }}
              className="bg-gray-800 hover:bg-gray-700 text-white h-8 text-sm"
            >
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminación */}
      <AlertDialog open={openConfirmDelete} onOpenChange={setOpenConfirmDelete}>
        <AlertDialogContent className="border border-gray-200 bg-white shadow-sm rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base text-gray-800">
              ¿Eliminar este evento?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600">
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-sm">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white h-8 text-sm"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Formulario Crear/Editar */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-[480px] border border-gray-200 bg-white shadow-sm rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-800">
              {selectedEvent ? "Editar evento" : "Nuevo evento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Fecha inicio</Label>
                <Input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) =>
                    setForm({ ...form, fecha_inicio: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Fecha fin</Label>
                <Input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) =>
                    setForm({ ...form, fecha_fin: e.target.value })
                  }
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Comentario</Label>
              <Input
                value={form.ubicacion}
                onChange={(e) =>
                  setForm({ ...form, ubicacion: e.target.value })
                }
                placeholder="Ej. Competencia Regional"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Deporte</Label>
              <Select
                value={form.iddeporte}
                onValueChange={(v) => setForm({ ...form, iddeporte: v })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecciona un deporte" />
                </SelectTrigger>
                <SelectContent>
                  {deportes.map((d) => (
                    <SelectItem key={d.iddeporte} value={String(d.iddeporte)}>
                      {d.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                onClick={handleSave}
                className="bg-gray-800 hover:bg-gray-700 text-white h-9 text-sm rounded-md"
              >
                Guardar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDashboard;
