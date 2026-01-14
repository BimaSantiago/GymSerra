import React, { useEffect, useState } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Ajusta la URL base si es necesario
const API_BASE = "https://academiagymserra.garzas.store";

interface Contacto {
  idcontacto: number;
  nombre_tutor: string;
  nombre_alumno: string;
  edad: number;
  telefono: string;
  mensaje: string;
  nombre_deporte: string;
}

interface ApiListResponse {
  success: boolean;
  contactos?: Contacto[];
  total?: number;
  error?: string;
}

const ContactosDashboard: React.FC = () => {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const totalPages = Math.ceil(total / limit) || 1;

  /* ==================== FETCH ==================== */

  const fetchContactos = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/contactos.php?action=list&page=${page}&limit=${limit}&search=${encodeURIComponent(
          search
        )}`
      );
      const data: ApiListResponse = await response.json();

      if (data.success && data.contactos) {
        setContactos(data.contactos);
        setTotal(data.total ?? data.contactos.length);
      } else {
        setContactos([]);
        setTotal(0);
        if (data.error) {
          setAlert({ type: "error", message: data.error });
          setTimeout(() => setAlert(null), 3000);
        }
      }
    } catch (error) {
      console.error("Error al obtener contactos:", error);
      setContactos([]);
      setTotal(0);
      setAlert({
        type: "error",
        message: "Error de conexión al obtener contactos",
      });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  useEffect(() => {
    fetchContactos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  /* ==================== EVENTOS ==================== */

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  /* ==================== RENDER ==================== */

  return (
    <div className="p-4">
      {alert && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="mb-4 rounded-2xl shadow-xl"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {alert.type === "success" ? "Éxito" : "Error"}
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* Título y Filtro */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-primary/80">Buzón de Contactos</h1>
        <Input
          placeholder="Buscar por nombre, teléfono o deporte..."
          value={search}
          onChange={handleSearch}
          className="max-w-sm rounded-lg shadow-md"
        />
      </div>

      {/* Tabla */}
      <div className="rounded-md shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Tutor</TableHead>
              <TableHead>Alumno</TableHead>
              <TableHead className="w-[80px]">Edad</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Interés (Deporte)</TableHead>
              <TableHead>Mensaje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contactos.map((c) => (
              <TableRow key={c.idcontacto}>
                <TableCell>{c.idcontacto}</TableCell>
                <TableCell>{c.nombre_tutor}</TableCell>
                <TableCell>{c.nombre_alumno}</TableCell>
                <TableCell>{c.edad}</TableCell>
                <TableCell>{c.telefono}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {c.nombre_deporte}
                  </span>
                </TableCell>
                <TableCell
                  className="max-w-xs truncate text-muted-foreground"
                  title={c.mensaje}
                >
                  {c.mensaje}
                </TableCell>
              </TableRow>
            ))}

            {contactos.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-gray-500 py-8"
                >
                  No se encontraron contactos registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="bg-gray-800 hover:bg-gray-700 text-white border-0"
        >
          Anterior
        </Button>
        <span>
          Página {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage(page + 1)}
          className="bg-gray-800 hover:bg-gray-700 text-white border-0"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};

export default ContactosDashboard;
