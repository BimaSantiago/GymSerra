import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin, X } from "lucide-react";

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
];

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
      setSelectedEvent(null); // 🔹 Ocultar detalle al cambiar de día
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
      {/* Calendario */}
      <div className="lg:w-1/3">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Calendario de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
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

      {/* Lista y detalle */}
      <div className="lg:w-2/3 space-y-4">
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
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    selectedEvent?.id === event.id
                      ? "border-primary shadow-sm bg-muted/30"
                      : ""
                  }`}
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
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No hay eventos programados para este día.</p>
                <p className="text-sm mt-1">
                  ¡Explora nuestras clases de gimnasia artística!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de detalles */}
        {selectedEvent && (
          <Card className="border-primary/40 shadow-sm transition-all -gap-2">
            <CardHeader className="flex justify-between items-center">
              <div className="flex justify-between w-full">
                <CardTitle>{selectedEvent.title}</CardTitle>
                <Badge className={getEventColor(selectedEvent.type)}>
                  {selectedEvent.type === "gimnasia-artistica"
                    ? "Gimnasia Artística"
                    : selectedEvent.type === "parkour"
                    ? "Parkour"
                    : "Crossfit"}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="pb-6">
              <p className="text-sm text-gray-600">
                {selectedEvent.description}
              </p>
              <div className=" space-y-2 text-sm py-2 ">
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
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EventCalendar;
