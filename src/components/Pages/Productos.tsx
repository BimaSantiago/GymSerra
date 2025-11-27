"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Producto {
  idarticulo: number;
  nombre: string;
  descripcion: string;
  descripcion2: string;
  stock: number;
  estado: string;
  img: string;
}

interface ApiResponse {
  articulos: Producto[];
  total: number;
  page: number;
  limit: number;
}

const Productos: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const perPage = 6;

  useEffect(() => {
    const fetchProductos = async (): Promise<void> => {
      try {
        const res = await fetch(
          "http://localhost/GymSerra/public/api/articulos.php?action=list"
        );
        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status}`);
        }

        const data: ApiResponse = await res.json();

        if (Array.isArray(data.articulos)) {
          const normalizados: Producto[] = data.articulos.map((p) => ({
            ...p,
            idarticulo: Number(p.idarticulo),
            stock: Number(p.stock),
            img: p.img.startsWith("/") ? p.img : `/${p.img}`,
          }));
          setProductos(normalizados);
        } else {
          setError("No se pudieron obtener los productos del servidor.");
        }
      } catch {
        setError("Error al conectar con la API de productos.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  const totalPages = Math.ceil(productos.length / perPage);
  const displayedProductos = productos.slice(
    (page - 1) * perPage,
    page * perPage
  );

  const handlePageChange = (newPage: number): void => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto py-16 px-6 space-y-12">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-bold text-center text-gray-800"
      >
        Nuestros Productos
      </motion.h1>

      {/* 🔴 Error */}
      {error && (
        <p className="text-center text-red-600 bg-red-50 border border-red-200 p-3 rounded">
          {error}
        </p>
      )}

      {/* ⏳ Cargando */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[360px] w-full rounded-lg" />
          ))}
        </div>
      ) : displayedProductos.length === 0 ? (
        <p className="text-center text-gray-500">
          No hay productos disponibles.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedProductos.map((producto, i) => (
              <motion.div
                key={producto.idarticulo}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 bg-white">
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
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-gray-800 text-center">
                      {producto.nombre}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center px-4 pb-5">
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {producto.descripcion}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      {producto.descripcion2}
                    </p>
                    <p
                      className={`font-semibold mb-3 ${
                        producto.stock > 0
                          ? "text-green-600"
                          : "text-red-500 italic"
                      }`}
                    >
                      {producto.stock > 0
                        ? `En stock: ${producto.stock}`
                        : "Sin stock"}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* 🔢 Paginación */}
          {totalPages > 1 && (
            <Pagination className="mt-10">
              <PaginationContent className="flex justify-center space-x-1">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(page - 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      onClick={() => handlePageChange(i + 1)}
                      isActive={page === i + 1}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(page + 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
};

export default Productos;
