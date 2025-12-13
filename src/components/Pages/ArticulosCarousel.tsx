"use client";
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Skeleton } from "@/components/ui/skeleton";

interface Articulo {
  idarticulo: number;
  nombre: string;
  descripcion: string;
  img: string;
  precio: number;
}

export function ArticulosCarousel() {
  const [articulos, setArticulos] = React.useState<Articulo[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  const plugin = React.useRef(
    Autoplay({
      delay: 3000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  );

  React.useEffect(() => {
    const fetchArticulos = async () => {
      try {
        const res = await fetch(
          "http://localhost/GymSerra/public/api/data.php?action=carruselArticulos"
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.articulos)) {
          setArticulos(data.articulos);
        }
      } catch (error) {
        console.error("Error al cargar artículos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticulos();
  }, []);

  React.useEffect(() => {
    if (!api) return;

    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap() + 1);
    };

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", handleSelect);

    const pluginInstance = plugin.current;

    return () => {
      api.off("select", handleSelect);
      pluginInstance?.reset();
    };
  }, [api]);

  // 🔹 Skeletons mientras carga
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-52 w-full rounded-xl" />
            <Skeleton className="h-5 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (articulos.length === 0) {
    return (
      <p className="text-center text-gray-500">No hay productos disponibles.</p>
    );
  }

  return (
    <div className="mx-auto max-w-[90vw] sm:max-w-[85vw] md:max-w-4xl lg:max-w-5xl">
      <Carousel
        setApi={setApi}
        className="w-full"
        plugins={[plugin.current]}
        opts={{
          loop: true,
          align: "center",
          skipSnaps: false,
          containScroll: "trimSnaps",
        }}
        onMouseEnter={() => plugin.current.stop()}
        onMouseLeave={() => plugin.current.play()}
      >
        <CarouselContent className="relative">
          {articulos.map((articulo, index) => (
            <CarouselItem
              key={index}
              className="transition-transform duration-700 ease-in-out"
            >
              <motion.div
                initial={{ opacity: 0.7, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                }}
                viewport={{ once: false, amount: 0.7 }}
              >
                <Card className="overflow-hidden shadow-md hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-300 transition-all duration-300 border border-gray-100">
                  <CardContent className="p-0">
                    <motion.img
                      src={articulo.img}
                      alt={articulo.nombre}
                      className="w-full h-60 object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.8 }}
                    />
                    <div className="p-5 text-center">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {articulo.nombre}
                      </h3>
                      <p className="text-gray-600 font-bold mb-2">
                        ${articulo.precio ?? "N/A"}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                        {articulo.descripcion}
                      </p>
                      <Link to="/productos">
                        <Button
                          variant="ghost"
                          className="rounded-full text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors duration-300"
                        >
                          Ver mas articulos
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Botones */}
        <CarouselPrevious className="hidden sm:flex -left-8 sm:-left-10 bg-blue-600 hover:bg-blue-700 text-white shadow-lg" />
        <CarouselNext className="hidden sm:flex -right-8 sm:-right-10 bg-blue-600 hover:bg-blue-700 text-white shadow-lg" />
      </Carousel>

      {/* Indicador de página */}
      <div className="text-muted-foreground py-3 text-center text-sm md:text-base">
        Página {current} de {count}
      </div>
    </div>
  );
}
