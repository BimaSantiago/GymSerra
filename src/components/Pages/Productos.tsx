"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Producto {
  idarticulo: number;
  nombre: string;
  descripcion: string;
  descripcion2: string;
  stock: number;
  estado: string;
  img: string;

  // viene del PHP (no obligatorio para esta vista, pero puede servir)
  ganancia?: number;
  iva_aplicable?: string;
}

interface ApiListResponse {
  success: boolean;
  error?: string;
  articulos?: any[];
  total?: number;
  page?: number;
  limit?: number;
}

type TipoArticulo = "venta" | "establecimiento";

type ParsedDesc2 = {
  tipo: string; // primera parte
  extra: string; // segunda parte (en ventas = precio)
};

const API_BASE = "http://localhost/GymSerra/public/api/articulos.php";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function resolveImgPath(raw: string): string {
  if (!raw) return "/uploads/articulos/default.jpg";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  return `/${raw}`;
}

function normalizeProducto(p: any): Producto {
  return {
    idarticulo: Number(p?.idarticulo ?? 0),
    nombre: String(p?.nombre ?? ""),
    descripcion: String(p?.descripcion ?? ""),
    descripcion2: String(p?.descripcion2 ?? ""),
    stock: Number(p?.stock ?? 0),
    estado: String(p?.estado ?? ""),
    img: resolveImgPath(String(p?.img ?? "")),
    ganancia: p?.ganancia != null ? Number(p.ganancia) : undefined,
    iva_aplicable:
      p?.iva_aplicable != null ? String(p.iva_aplicable) : undefined,
  };
}

function parseDescripcion2(raw: string): ParsedDesc2 {
  const s = (raw ?? "").trim();
  if (!s) return { tipo: "establecimiento", extra: "" };

  const separators = ["|", ";", ",", "-", "/"];
  for (const sep of separators) {
    const parts = s
      .split(sep)
      .map((x) => x.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return { tipo: parts[0], extra: parts.slice(1).join(` ${sep} `).trim() };
    }
  }
  // si no hay separador: todo cuenta como tipo
  return { tipo: s, extra: "" };
}

function detectTipo(p: Producto): { tipo: TipoArticulo; parsed: ParsedDesc2 } {
  const parsed = parseDescripcion2(p.descripcion2);
  const t = parsed.tipo.toLowerCase();

  // regla: si la primera parte contiene “venta” => ventas
  if (t.includes("venta")) return { tipo: "venta", parsed };

  // todo lo demás => establecimiento
  return { tipo: "establecimiento", parsed };
}

function formatPrice(extra: string): string | null {
  // extra podría venir como "$ 1,200.50" o "1200" etc.
  const cleaned = (extra || "").replace(/[^\d.,]/g, "").trim();
  if (!cleaned) return null;

  // intento básico: convertir a número (maneja 1,200.50)
  const normalized = cleaned.replace(/,/g, "");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;

  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

const Productos: React.FC = () => {
  const [allProductos, setAllProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<TipoArticulo>("venta");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // paginación por pestaña (client-side)
  const [limit, setLimit] = useState<number>(9);
  const [pageVenta, setPageVenta] = useState<number>(1);
  const [pageEst, setPageEst] = useState<number>(1);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPageVenta(1);
    setPageEst(1);
  }, [debouncedSearch, limit]);

  const fetchAll = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setError(null);
      setLoading(true);

      // Traemos todo para poder dividir por descripcion2 (ventas/establecimiento)
      const url = new URL(API_BASE);
      url.searchParams.set("action", "list");
      url.searchParams.set("page", "1");
      url.searchParams.set("limit", "10000");

      const res = await fetch(url.toString(), {
        signal: controller.signal,
        credentials: "include",
      });

      if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

      let data: ApiListResponse;
      try {
        data = (await res.json()) as ApiListResponse;
      } catch {
        throw new Error("La API no devolvió un JSON válido.");
      }

      if (!data?.success) {
        throw new Error(data?.error || "La API respondió con success=false.");
      }

      const list = Array.isArray(data.articulos) ? data.articulos : [];
      setAllProductos(list.map(normalizeProducto));
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setAllProductos([]);
      setError(e?.message || "Error al conectar con la API de productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return allProductos;
    const q = debouncedSearch.toLowerCase();
    return allProductos.filter((p) => {
      const a = (p.nombre || "").toLowerCase();
      const b = (p.descripcion || "").toLowerCase();
      const c = (p.descripcion2 || "").toLowerCase();
      return a.includes(q) || b.includes(q) || c.includes(q);
    });
  }, [allProductos, debouncedSearch]);

  const ventaList = useMemo(() => {
    return filtered.filter((p) => detectTipo(p).tipo === "venta");
  }, [filtered]);

  const estList = useMemo(() => {
    return filtered.filter((p) => detectTipo(p).tipo === "establecimiento");
  }, [filtered]);

  const totalPagesVenta = Math.max(1, Math.ceil(ventaList.length / limit));
  const totalPagesEst = Math.max(1, Math.ceil(estList.length / limit));

  const currentPage = tab === "venta" ? pageVenta : pageEst;
  const totalPages = tab === "venta" ? totalPagesVenta : totalPagesEst;

  const pagedVenta = useMemo(() => {
    const start = (pageVenta - 1) * limit;
    return ventaList.slice(start, start + limit);
  }, [ventaList, pageVenta, limit]);

  const pagedEst = useMemo(() => {
    const start = (pageEst - 1) * limit;
    return estList.slice(start, start + limit);
  }, [estList, pageEst, limit]);

  const showingText = useMemo(() => {
    const list = tab === "venta" ? ventaList : estList;
    const p = tab === "venta" ? pageVenta : pageEst;

    if (list.length === 0) return "Sin resultados";
    const from = (p - 1) * limit + 1;
    const to = Math.min(p * limit, list.length);
    return `Mostrando ${from}-${to} de ${list.length}`;
  }, [tab, ventaList, estList, pageVenta, pageEst, limit]);

  const goToPage = (next: number) => {
    const clamped = clamp(next, 1, totalPages);
    if (tab === "venta") setPageVenta(clamped);
    else setPageEst(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const ProductCard = ({
    producto,
    tipo,
  }: {
    producto: Producto;
    tipo: TipoArticulo;
  }) => {
    const { parsed } = detectTipo(producto);
    const price = tipo === "venta" ? formatPrice(parsed.extra) : null;

    return (
      <Card className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 bg-white">
        <div className="relative overflow-hidden">
          <img
            src={producto.img}
            alt={producto.nombre}
            className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "/uploads/articulos/default.jpg";
            }}
          />

          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant={tipo === "venta" ? "default" : "secondary"}>
              {tipo === "venta" ? "Ventas" : "Establecimiento"}
            </Badge>
            {producto.estado && (
              <Badge variant="outline">{producto.estado}</Badge>
            )}
          </div>
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-900 text-center">
            {producto.nombre}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 pb-6 space-y-3">
          <p className="text-sm text-gray-600 text-center line-clamp-2">
            {producto.descripcion || "Sin descripción"}
          </p>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="outline" title="Tipo (1ª parte de descripcion2)">
              {parsed.tipo || "Sin tipo"}
            </Badge>

            {tipo === "venta" && (
              <Badge
                variant="default"
                title="Precio (2ª parte de descripcion2)"
              >
                {price ?? "Precio no definido"}
              </Badge>
            )}

            {tipo === "establecimiento" && parsed.extra && (
              <Badge
                variant="outline"
                title="Detalle (2ª parte de descripcion2)"
              >
                {parsed.extra}
              </Badge>
            )}
          </div>

          <Separator />

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Este artículo{" "}
              <span className="font-medium">
                no está disponible para compra
              </span>
              .
            </p>
            <div className="mt-3">
              <Button className="w-full" variant="secondary">
                Ver info
              </Button>
              <p className="text-xs text-gray-400 mt-2">
                ID: {producto.idarticulo}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ title }: { title: string }) => (
    <div className="text-center bg-gray-50 border border-gray-200 p-10 rounded-xl">
      <p className="text-gray-800 font-medium">{title}</p>
      <p className="text-sm text-gray-500 mt-1">
        Prueba con otra búsqueda o limpia el filtro.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Button
          variant="secondary"
          onClick={() => setSearch("")}
          disabled={!search}
        >
          Limpiar búsqueda
        </Button>
        <Button onClick={fetchAll}>Recargar</Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-16 px-6 space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-3"
      >
        <h1 className="text-3xl font-bold text-center text-gray-900">
          Catálogo
        </h1>
      </motion.div>

      {/* Controles */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full sm:w-auto">
          <div className="w-full sm:w-[360px]">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, descripción o descripcion2…"
              aria-label="Buscar artículos"
            />
            <p className="mt-1 text-xs text-gray-500">
              {debouncedSearch ? (
                <>
                  Filtrando:{" "}
                  <span className="font-medium text-gray-700">
                    “{debouncedSearch}”
                  </span>
                </>
              ) : (
                "Tip: escribe para filtrar resultados."
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Por página:</span>
            <select
              className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              aria-label="Artículos por página"
            >
              {[6, 9, 12, 18].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600">{showingText}</div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-red-700 bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-sm">
            <span className="font-semibold">Ocurrió un error:</span> {error}
          </p>
          <Button onClick={fetchAll} variant="destructive">
            Reintentar
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-[390px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as TipoArticulo)}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="venta" className="gap-2">
                Ventas <Badge variant="secondary">{ventaList.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="establecimiento" className="gap-2">
                Establecimiento{" "}
                <Badge variant="secondary">{estList.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="venta" className="space-y-6">
            {ventaList.length === 0 ? (
              <EmptyState title="No hay artículos marcados como ventas con este filtro." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {pagedVenta.map((p, i) => (
                  <motion.div
                    key={p.idarticulo}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <ProductCard producto={p} tipo="venta" />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="establecimiento" className="space-y-6">
            {estList.length === 0 ? (
              <EmptyState title="No hay artículos del establecimiento con este filtro." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {pagedEst.map((p, i) => (
                  <motion.div
                    key={p.idarticulo}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <ProductCard producto={p} tipo="establecimiento" />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Paginación unificada por pestaña */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="secondary"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Anterior
              </Button>

              <div className="text-sm text-gray-600">
                Página <span className="font-medium">{currentPage}</span> de{" "}
                <span className="font-medium">{totalPages}</span>
              </div>

              <Button
                variant="secondary"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </Tabs>
      )}
    </div>
  );
};

export default Productos;
