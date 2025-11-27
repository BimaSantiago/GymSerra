import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CheckCircle2, AlertCircle, Trash2 } from "lucide-react";

interface Articulo {
  idarticulo: number;
  nombre: string;
  stock: number;
}

interface Detalle {
  iddetalle: number;
  idarticulo: number;
  articulo: string;
  conteo: number;
  diferencia: number;
}

interface AjusteInfo {
  idajuste: number;
  comentario: string;
  fecha: string;
}

interface ApiResponse {
  success?: boolean;
  info?: AjusteInfo;
  detalles?: Detalle[];
  articulos?: Articulo[];
  idajuste?: number;
  error?: string;
}

const AjustesDetalle: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Tipo y ajuste desde URL (pueden no existir)
  const initialTipo = (searchParams.get("tipo") as "entrada" | "salida") || "";
  const initialId = Number(searchParams.get("idajuste")) || null;

  const [tipo, setTipo] = useState<"entrada" | "salida" | "">(initialTipo);
  const [idajuste, setIdajuste] = useState<number | null>(initialId);
  const [comentario, setComentario] = useState("");

  const [info, setInfo] = useState<AjusteInfo | null>(null);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [form, setForm] = useState({
    idarticulo: "",
    conteo: "",
    diferencia: "",
  });

  /* ============================================================
   *  CARGAR DATOS SI YA EXISTE AJUSTE
   * ============================================================ */
  useEffect(() => {
    if (idajuste && tipo) {
      void fetchArticulos();
      void fetchDetalles();
    }
  }, [idajuste, tipo]);

  const fetchArticulos = async (): Promise<void> => {
    try {
      const res = await fetch(
        "http://localhost/GymSerra/public/api/articulos.php?action=list"
      );
      const data = await res.json();
      if (Array.isArray(data.articulos)) setArticulos(data.articulos);
    } catch {
      console.error("Error cargando artículos");
    }
  };

  const fetchDetalles = async (): Promise<void> => {
    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/ajustes.php?action=detalle&tipo=${tipo}&idajuste=${idajuste}`
      );
      const data: ApiResponse = await res.json();
      if (data.success) {
        setInfo(data.info ?? null);
        setDetalles(data.detalles ?? []);
      }
    } catch {
      console.error("Error cargando detalles");
    }
  };

  /* ============================================================
   *  CREAR NUEVO AJUSTE
   * ============================================================ */
  const handleCrearAjuste = async (): Promise<void> => {
    if (!tipo || !comentario) {
      setAlert({
        type: "error",
        message: "Selecciona tipo y escribe una justificación.",
      });
      return;
    }

    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/ajustes.php?action=create&tipo=${tipo}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comentario }),
        }
      );
      const data: ApiResponse = await res.json();

      if (data.success && data.idajuste) {
        setIdajuste(data.idajuste);
        setAlert({ type: "success", message: "Ajuste creado correctamente." });
        void fetchArticulos();
      } else {
        setAlert({
          type: "error",
          message: data.error ?? "Error al crear el ajuste.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Error al conectar con el servidor.",
      });
    }
  };

  /* ============================================================
   *  CALCULAR DIFERENCIA AUTOMÁTICAMENTE
   * ============================================================ */
  useEffect(() => {
    const selected = articulos.find(
      (a) => String(a.idarticulo) === form.idarticulo
    );
    if (selected) {
      const stockActual = selected.stock;
      const conteo = Number(form.conteo) || 0;
      const diferencia = conteo - stockActual;
      setForm((prev) => ({ ...prev, diferencia: String(diferencia) }));
    }
  }, [form.conteo, form.idarticulo, articulos]);

  /* ============================================================
   *  AGREGAR DETALLE
   * ============================================================ */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!idajuste) {
      setAlert({
        type: "error",
        message: "Primero crea el ajuste antes de agregar detalles.",
      });
      return;
    }

    if (!form.idarticulo || !form.conteo) {
      setAlert({
        type: "error",
        message: "Selecciona un artículo y completa los campos.",
      });
      return;
    }

    const body = {
      idajuste,
      idarticulo: Number(form.idarticulo),
      conteo: Number(form.conteo),
      diferencia: Number(form.diferencia),
    };

    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/ajustes.php?action=addDetalle&tipo=${tipo}`,
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
          message: "Detalle agregado correctamente.",
        });
        setForm({ idarticulo: "", conteo: "", diferencia: "" });
        void fetchDetalles();
      } else {
        setAlert({
          type: "error",
          message: data.error ?? "Error al agregar detalle.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Error de conexión con el servidor.",
      });
    }
  };

  /* ============================================================
   *  ELIMINAR DETALLE
   * ============================================================ */
  const handleDelete = async (id: number): Promise<void> => {
    if (!confirm("¿Eliminar este detalle?")) return;
    try {
      const res = await fetch(
        `http://localhost/GymSerra/public/api/ajustes.php?action=deleteDetalle&tipo=${tipo}&iddetalle=${id}`
      );
      const data = await res.json();
      if (data.success) {
        setAlert({ type: "success", message: "Detalle eliminado." });
        void fetchDetalles();
      } else {
        setAlert({
          type: "error",
          message: data.error ?? "Error al eliminar.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Error de conexión con el servidor.",
      });
    }
  };

  /* ============================================================
   *  RENDER
   * ============================================================ */
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">
          {idajuste ? (
            <>
              {tipo === "entrada" ? "Ajuste de Entrada" : "Ajuste de Salida"} #
              {idajuste}
            </>
          ) : (
            "Crear nuevo ajuste"
          )}
        </h2>
        <Button
          onClick={() => navigate("/dashboard/ajustes")}
          variant="outline"
        >
          Volver
        </Button>
      </div>

      {alert && (
        <Alert
          variant={alert.type === "success" ? "default" : "destructive"}
          className="mb-4 rounded-2xl shadow-lg bg-gray-50"
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

      {/* ========================= CREAR AJUSTE ========================= */}
      {!idajuste && (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de ajuste</Label>
              <Select
                value={tipo}
                onValueChange={(v) => setTipo(v as "entrada" | "salida")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">
                    Entrada (incrementa stock)
                  </SelectItem>
                  <SelectItem value="salida">Salida (reduce stock)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Justificación</Label>
              <Input
                placeholder="Ej. Reposición, daño, pérdida, ajuste físico..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleCrearAjuste}
            className="bg-gray-800 text-white hover:bg-gray-700 w-full"
          >
            Crear Ajuste
          </Button>
        </div>
      )}

      {/* ========================= DETALLES DEL AJUSTE ========================= */}
      {idajuste && (
        <>
          {info && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4 shadow-sm">
              <p>
                <strong>Fecha:</strong> {info.fecha}
              </p>
              <p>
                <strong>Comentario:</strong> {info.comentario}
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white p-6 rounded-xl shadow-lg mb-6"
          >
            <h3 className="font-semibold text-lg mb-2">
              Agregar artículo al ajuste
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Artículo</Label>
                <Select
                  value={form.idarticulo}
                  onValueChange={(v) => setForm({ ...form, idarticulo: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un artículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {articulos.map((a) => (
                      <SelectItem
                        key={a.idarticulo}
                        value={String(a.idarticulo)}
                      >
                        {a.nombre} (Stock: {a.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Conteo actual</Label>
                <Input
                  type="number"
                  value={form.conteo}
                  onChange={(e) => setForm({ ...form, conteo: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Diferencia</Label>
                <Input type="number" value={form.diferencia} readOnly />
              </div>
            </div>

            <Button
              type="submit"
              className="bg-gray-800 text-white hover:bg-gray-700 w-full"
            >
              Agregar Detalle
            </Button>
          </form>

          <Table className="border border-gray-200 rounded-lg">
            <TableHeader>
              <TableRow>
                <TableHead>Artículo</TableHead>
                <TableHead>Conteo</TableHead>
                <TableHead>Diferencia</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detalles.length > 0 ? (
                detalles.map((d) => (
                  <TableRow key={d.iddetalle}>
                    <TableCell>{d.articulo}</TableCell>
                    <TableCell>{d.conteo}</TableCell>
                    <TableCell>{d.diferencia}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(d.iddetalle)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-gray-500 py-4"
                  >
                    No hay artículos ajustados todavía.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
};

export default AjustesDetalle;
