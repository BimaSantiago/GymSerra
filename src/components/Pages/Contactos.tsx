import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertCircle,
  Send,
  MessageCircle,
  Phone,
  User,
  Users,
  Calendar,
  Mail,
} from "lucide-react";

interface Deporte {
  iddeporte: number;
  nombre: string;
  color: string;
}

const Contactos: React.FC = () => {
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    iddeporte: 0,
    nombre_tutor: "",
    nombre_alumno: "",
    edad: "",
    telefono: "",
    mensaje: "",
  });

  useEffect(() => {
    void fetchDeportes();
  }, []);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
  };

  const fetchDeportes = async (): Promise<void> => {
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/contactos.php?action=deportes"
      );
      const data = await res.json();
      if (data.success) {
        setDeportes(data.deportes ?? []);
      }
    } catch {
      console.error("Error al cargar deportes");
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (
      !formData.iddeporte ||
      !formData.nombre_tutor ||
      !formData.nombre_alumno ||
      !formData.edad ||
      !formData.telefono
    ) {
      showAlert("error", "Por favor completa todos los campos obligatorios");
      return;
    }

    const edad = Number(formData.edad);
    if (edad < 3 || edad > 100) {
      showAlert("error", "La edad debe estar entre 3 y 100 años");
      return;
    }

    setProcessing(true);

    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/contactos.php?action=create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (data.success) {
        showAlert(
          "success",
          "¡Gracias por tu interés! Nos pondremos en contacto contigo pronto."
        );

        // Limpiar formulario
        setFormData({
          iddeporte: 0,
          nombre_tutor: "",
          nombre_alumno: "",
          edad: "",
          telefono: "",
          mensaje: "",
        });
      } else {
        showAlert("error", data.error ?? "Error al enviar el formulario");
      }
    } catch {
      showAlert("error", "Error de conexión. Por favor intenta de nuevo.");
    } finally {
      setProcessing(false);
    }
  };

  const handleWhatsApp = (): void => {
    const deporteSeleccionado = deportes.find(
      (d) => d.iddeporte === formData.iddeporte
    );

    const mensaje = `Hola! Me interesa información sobre ${
      deporteSeleccionado?.nombre || "sus clases"
    }.%0A%0ANombre del tutor: ${
      formData.nombre_tutor || "-"
    }%0ANombre del alumno: ${formData.nombre_alumno || "-"}%0AEdad: ${
      formData.edad || "-"
    }%0A%0A${formData.mensaje || ""}`;

    // Número de WhatsApp del gimnasio
    const numeroWhatsApp = "5620770243";
    window.open(`https://wa.me/${numeroWhatsApp}?text=${mensaje}`, "_blank");
  };

  const deporteSeleccionado = deportes.find(
    (d) => d.iddeporte === formData.iddeporte
  );

  return (
    <div className="min-h-screen p-6 text-black">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 text-blue-800 pt-3">
            ¡Únete a Nuestra Familia Deportiva!
          </h1>
          <p className="text-lg text-muted-foreground">
            Completa el formulario y descubre cómo podemos ayudarte a alcanzar
            tus metas
          </p>
        </div>

        {alert && (
          <Alert
            variant={alert.type === "success" ? "default" : "destructive"}
            className="mb-6 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-300 bg-gray-50 text-black/70"
          >
            {alert.type === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <AlertTitle className="font-bold">
              {alert.type === "success" ? "¡Registro Exitoso!" : "Error"}
            </AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de Deporte */}
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl text-blue-800">
                <Users className="h-6 w-6 text-blue-500" />
                Selecciona el Deporte de Tu Interés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-black/60 pb-3">
                Elige el deporte que más te apasione
              </p>
              <Select
                value={String(formData.iddeporte)}
                onValueChange={(value) =>
                  setFormData({ ...formData, iddeporte: Number(value) })
                }
              >
                <SelectTrigger className="h-14 border-2 transition-colors text-black/70 text-start hover:border-blue-800">
                  <SelectValue
                    placeholder="Selecciona un deporte..."
                    className="text-black/70"
                  />
                  Selecciona un deporte
                </SelectTrigger>
                <SelectContent className="bg-gray-50 text-black/70">
                  {deportes.map((deporte) => (
                    <SelectItem
                      key={deporte.iddeporte}
                      value={String(deporte.iddeporte)}
                      className="cursor-pointer hover:bg-blue-50 text-black/70 hover:text-black/80"
                    >
                      <div className="flex items-center gap-3 py-1">
                        <span
                          className="w-4 h-4 rounded-full shadow-md "
                          style={{ backgroundColor: deporte.color }}
                        />
                        <span className="font-medium text-">
                          {deporte.nombre}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {deporteSeleccionado && (
                <div className="mt-4 p-4 rounded-lg">
                  <Badge
                    style={{
                      backgroundColor: deporteSeleccionado.color,
                      color: "#fff",
                    }}
                    className="text-sm px-3 py-1 shadow-lg"
                  >
                    Deporte seleccionado: {deporteSeleccionado.nombre}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del Contacto */}
          <Card className="border-none shadow-md text-blue-800">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <User className="h-6 w-6 text-blue-500" />
                Información de Contacto
              </CardTitle>
              <CardDescription>
                Datos del tutor y del alumno interesado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-green-500" />
                    Nombre del Tutor <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.nombre_tutor}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre_tutor: e.target.value })
                    }
                    placeholder="Ej. María García López"
                    className="h-12 border-2 hover:border-blue-800 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    Nombre del Alumno <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.nombre_alumno}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nombre_alumno: e.target.value,
                      })
                    }
                    placeholder="Ej. Juan García"
                    className="h-12 border-2  hover:border-blue-800 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    Edad del Alumno <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={formData.edad}
                    onChange={(e) =>
                      setFormData({ ...formData, edad: e.target.value })
                    }
                    placeholder="Ej. 8"
                    min="3"
                    max="100"
                    className="h-12 border-2  hover:border-blue-800 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-500" />
                    Teléfono <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                    placeholder="Ej. 4431234567"
                    className="h-12 border-2 hover:border-green-400 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-500" />
                  Mensaje Adicional (Opcional)
                </Label>
                <Textarea
                  value={formData.mensaje}
                  onChange={(e) =>
                    setFormData({ ...formData, mensaje: e.target.value })
                  }
                  placeholder="Cuéntanos más sobre tus expectativas, horarios preferidos, experiencia previa, etc."
                  className="min-h-[120px] border-2  hover:border-blue-800 transition-colors resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              type="submit"
              disabled={processing}
              className="h-14 text-lg bg-blue-800 hover:bg-blue-500 text-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              {processing ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Enviar Solicitud
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleWhatsApp}
              disabled={!formData.nombre_tutor || !formData.telefono}
              className="h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Contactar por WhatsApp
            </Button>
          </div>

          <p className="text-center text-sm  mt-4">
            <span className="text-red-500">*</span> Campos obligatorios
          </p>
        </form>

        {/* Información Adicional */}
        <Card className="mt-8 border-none shadow-xl ">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-blue-800">
                ¿Necesitas ayuda?
              </h3>
              <p className="text-black/60">
                Estamos aquí para responder todas tus preguntas y ayudarte a
                comenzar tu viaje deportivo.
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <Badge variant="outline" className="px-4 py-2 bg-blue-500">
                  <Phone className="h-4 w-4 mr-2" />
                  +52 1 55 8260 6391
                </Badge>
                <Badge variant="outline" className="px-4 py-2 bg-blue-500">
                  <Mail className="h-4 w-4 mr-2" />
                  contacto@gymserra.com
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contactos;
