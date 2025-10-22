import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin, Users } from "lucide-react";

type EventType = "gimnasia-artistica" | "parkour" | "crossfit";

type Event = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  location: string;
  participants: number;
  type: EventType;
  description: string;
};

// Datos de ejemplo para eventos
const EXAMPLE_EVENTS: Event[] = [
  {
    id: 1,
    title: "Clase de Gimnasia Artística - Nivel Inicial",
    start: new Date("2025-11-01T10:00:00"),
    end: new Date("2025-11-01T11:30:00"),
    location: "Sala Principal - Gym Serra",
    participants: 12,
    type: "gimnasia-artistica",
    description:
      "Introducción a rutinas básicas de gimnasia artística para principiantes.",
  },
  {
    id: 2,
    title: "Taller de Parkour Avanzado",
    start: new Date("2025-11-05T16:00:00"),
    end: new Date("2025-11-05T17:30:00"),
    location: "Área Exterior",
    participants: 8,
    type: "parkour",
    description: "Técnicas avanzadas de saltos y flips en parkour.",
  },
  {
    id: 3,
    title: "Sesión de Crossfit para Adultos",
    start: new Date("2025-11-10T18:00:00"),
    end: new Date("2025-11-10T19:00:00"),
    location: "Zona Funcional",
    participants: 15,
    type: "crossfit",
    description: "Entrenamiento HIIT con énfasis en fuerza y resistencia.",
  },
  {
    id: 4,
    title: "Competencia Interna de Gimnasia Artística",
    start: new Date("2025-11-15T09:00:00"),
    end: new Date("2025-11-15T12:00:00"),
    location: "Sala Principal - Gym Serra",
    participants: 20,
    type: "gimnasia-artistica",
    description:
      "Evento competitivo para destacar el talento en gimnasia artística.",
  },
  {
    id: 5,
    title: "Clase Abierta de Gimnasia Artística",
    start: new Date("2025-11-20T11:00:00"),
    end: new Date("2025-11-20T12:30:00"),
    location: "Sala Principal - Gym Serra",
    participants: 10,
    type: "gimnasia-artistica",
    description:
      "Clase gratuita para nuevos interesados en gimnasia artística.",
  },
];

// Función para obtener eventos del día seleccionado
const getEventsForDate = (date: Date, events: Event[]) => {
  return events.filter(
    (event) =>
      event.start.toDateString() === date.toDateString() ||
      (event.start < date && event.end > date)
  );
};

const EventCalendar = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleDateSelect = (selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const eventsForDate = getEventsForDate(date, EXAMPLE_EVENTS);

  const getEventColor = (type: string) => {
    switch (type) {
      case "gimnasia-artistica":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "parkour":
        return "bg-green-100 text-green-800 border-green-200";
      case "crossfit":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      {/* Calendario Lateral */}
      <div className="lg:w-1/3">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Calendario de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              required={true}
              selected={date}
              onSelect={handleDateSelect}
              className="rounded-md border"
              modifiers={{
                highlight: EXAMPLE_EVENTS.map((e) => e.start),
              }}
              modifiersStyles={{
                highlight: {
                  backgroundColor: "#dbeafe",
                  color: "#1e40af",
                  fontWeight: "bold",
                },
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Lista de Eventos */}
      <div className="lg:w-2/3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Eventos del{" "}
              {date.toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {eventsForDate.length > 0 ? (
              eventsForDate.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <Badge
                      variant="outline"
                      className={`border-2 ${getEventColor(event.type)}`}
                    >
                      {event.type === "gimnasia-artistica"
                        ? "Gimnasia Artística"
                        : event.type === "parkour"
                        ? "Parkour"
                        : "Crossfit"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {event.start.toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {event.end.toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{event.participants} participantes</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto h-12 w-12 opacity-50 mb-2" />
                <p>No hay eventos programados para este día.</p>
                <p className="text-sm mt-1">
                  ¡Explora nuestras clases de gimnasia artística!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detalle del Evento Seleccionado */}
        {selectedEvent && (
          <Popover
            open={!!selectedEvent}
            onOpenChange={() => setSelectedEvent(null)}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="mt-4 w-full"
                onClick={(e) => e.stopPropagation()}
              >
                Ver detalles del evento seleccionado
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedEvent.title}</CardTitle>
                  <Badge className={getEventColor(selectedEvent.type)}>
                    {selectedEvent.type === "gimnasia-artistica"
                      ? "Gimnasia Artística"
                      : selectedEvent.type === "parkour"
                      ? "Parkour"
                      : "Crossfit"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 p-6">
                  <p className="text-sm text-gray-600">
                    {selectedEvent.description}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {selectedEvent.start.toLocaleDateString("es-ES")} •{" "}
                        {selectedEvent.start.toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        -{" "}
                        {selectedEvent.end.toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedEvent.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{selectedEvent.participants} participantes</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Reservar plaza
                  </Button>
                </CardContent>
              </Card>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};

export default EventCalendar;
