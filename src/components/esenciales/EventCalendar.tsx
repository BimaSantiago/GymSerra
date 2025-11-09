"use client";
import React, {
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useState,
} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import type { EventApi, EventMountArg } from "@fullcalendar/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, CalendarDays } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/* ---------- Tipos ---------- */
interface Evento {
  idevento: number;
  fecha_inicio: string;
  fecha_fin: string;
  ubicacion: string;
  iddeporte: number;
  deporte?: string;
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
const EventCalendar: React.FC = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  useEffect(() => {
    void fetchEventos();
  }, []);

  const fetchEventos = async (): Promise<void> => {
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/eventos.php?action=list"
      );
      const data = await res.json();
      if (data.success) setEventos(data.eventos);
      else setAlert("No se pudieron cargar los eventos.");
    } catch {
      setAlert("Error de conexión con el servidor.");
    }
  };

  const eventosById = useMemo(() => {
    const m = new Map<string, Evento>();
    for (const ev of eventos) m.set(String(ev.idevento), ev);
    return m;
  }, [eventos]);

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

      const ended = hasEventEnded(arg.event);
      if (ended) {
        el.classList.add("opacity-60");
      } else {
        el.classList.remove("opacity-60");
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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-gray-700" />
          Calendario de eventos
        </h2>
      </div>

      {/* Alerta */}
      {alert && (
        <Alert
          variant="destructive"
          className="border border-gray-200 bg-gray-50 shadow-sm rounded-md"
        >
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-sm font-medium text-gray-800">
            Error
          </AlertTitle>
          <AlertDescription className="text-gray-600 text-sm">
            {alert}
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
          dayMaxEventRows={3}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventCalendar;
