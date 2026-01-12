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
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";

interface Articulo {
  idarticulo: number;
  nombre: string;
  descripcion: string;
  img: string;
}

export function ArticulosCarousel() {
  const [articulos, setArticulos] = React.useState<Articulo[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  const plugin = React.useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
      stopOnFocusIn: true,
    })
  );

  React.useEffect(() => {
    const fetchArticulos = async () => {
      try {
        // Obtener uniformes de categoría 3
        const res = await fetch(
          "https://academiagymserra.garzas.store/api/data.php?action=carruselUniformes"
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.articulos)) {
          setArticulos(data.articulos);
        }
      } catch (error) {
        console.error("Error al cargar uniformes:", error);
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

    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  // Reiniciar autoplay cuando el componente se monta o se actualiza
  React.useEffect(() => {
    if (api && articulos.length > 0) {
      plugin.current.play();
    }
  }, [api, articulos]);

  // Skeletons mientras carga
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
      <Card className="p-12 text-center bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
        <ShoppingBag className="h-16 w-16 mx-auto text-blue-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Uniformes Próximamente
        </h3>
        <p className="text-gray-600">
          Estamos preparando nuestros uniformes oficiales para ti
        </p>
      </Card>
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
          duration: 20,
        }}
        onMouseEnter={() => plugin.current.stop()}
        onMouseLeave={() => plugin.current.play()}
      >
        <CarouselContent className="relative">
          {articulos.map((articulo) => (
            <CarouselItem
              key={articulo.idarticulo}
              className="pl-2 md:pl-4 transition-all duration-500 ease-out"
            >
              <motion.div
                initial={{ opacity: 0.7, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                viewport={{ once: false, amount: 0.5 }}
              >
                <Card className="overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-blue-100/50 hover:border-green-400 transition-all duration-300 border-2 border-gray-200 group">
                  <CardContent className="p-0 relative">
                    <div className="relative h-60 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                      <motion.img
                        src={articulo.img || "/uploads/articulos/default.jpg"}
                        alt={articulo.nombre}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        onError={(e) => {
                          e.currentTarget.src =
                            "/uploads/articulos/default.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <Badge className="absolute top-3 right-3 bg-green-600 hover:bg-green-700 text-white border-0 shadow-lg ">
                        <ShoppingBag className="h-3 w-3 mr-1" />
                        Oficial
                      </Badge>
                    </div>

                    <div className="p-5 text-center">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-700 transition-colors">
                        {articulo.nombre}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                        {articulo.descripcion}
                      </p>

                      <div className="max-w-1/2 mx-auto flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-green-50 rounded-lg border border-green-200 mb-4">
                        <ShoppingBag className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-semibold text-green-900">
                          Disponible en tienda
                        </p>
                      </div>

                      <Link to="/productos">
                        <Button
                          variant="ghost"
                          className="rounded-full border text-green-600 hover:bg-blue-50 hover:text-green-800 transition-colors duration-300 font-semibold"
                        >
                          Ver más productos
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Botones de navegación */}
        <CarouselPrevious className="hidden sm:flex -left-8 sm:-left-12 bg-green-600 hover:bg-green-700 text-white shadow-lg border-0 h-12 w-12" />
        <CarouselNext className="hidden sm:flex -right-8 sm:-right-12 bg-green-600 hover:bg-green-700 text-white shadow-lg border-0 h-12 w-12" />
      </Carousel>

      {/* Indicador de página */}
      {count > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index + 1 === current
                  ? "w-8 bg-green-600"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Ir a slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      <div className="text-gray-500 py-3 text-center text-sm">
        Página {current} de {count}
      </div>
    </div>
  );
}
