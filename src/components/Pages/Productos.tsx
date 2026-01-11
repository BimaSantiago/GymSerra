import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Store,
  Sparkles,
  Package,
  Award,
  Eye,
} from "lucide-react";

interface Articulo {
  idarticulo: number;
  nombre: string;
  descripcion: string;
  img: string;
  idcategoria: number;
  categoria: string;
}

interface Categoria {
  idcategoria: number;
  nombre: string;
  descripcion: string;
  esVenta: boolean;
}

const Productos: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productosPorCategoria, setProductosPorCategoria] = useState<{
    [key: number]: Articulo[];
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const resCategorias = await fetch(
        "http://localhost/GymSerra/public/api/data.php?action=categoriasProductos"
      );
      const dataCategorias = await resCategorias.json();

      if (dataCategorias.success && dataCategorias.categorias) {
        setCategorias(dataCategorias.categorias);

        // Fetch productos para cada categoría
        for (const cat of dataCategorias.categorias) {
          const resProductos = await fetch(
            `http://localhost/GymSerra/public/api/data.php?action=productosPorCategoria&idcategoria=${cat.idcategoria}&limit=6`
          );
          const dataProductos = await resProductos.json();

          if (dataProductos.success) {
            setProductosPorCategoria((prev) => ({
              ...prev,
              [cat.idcategoria]: dataProductos.articulos || [],
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    } finally {
      setLoading(false);
    }
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-80 rounded-xl bg-gray-200 animate-pulse" />
      ))}
    </div>
  );

  const ProductCard = ({
    articulo,
    esVenta,
  }: {
    articulo: Articulo;
    esVenta: boolean;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Card className="group h-full overflow-hidden border-2 border-gray-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
        <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          <img
            src={articulo.img || "/uploads/articulos/default.jpg"}
            alt={articulo.nombre}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src = "/uploads/articulos/default.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <Badge
            className={`absolute top-3 right-3 ${
              esVenta
                ? "bg-green-500 hover:bg-green-600"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white border-0`}
          >
            {esVenta ? (
              <>
                <ShoppingBag className="h-3 w-3 mr-1" />
                Venta
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Disponible
              </>
            )}
          </Badge>
        </div>

        <CardContent className="p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {articulo.nombre}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-3 mb-4">
            {articulo.descripcion}
          </p>
          <div
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${
              esVenta
                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
            }`}
          >
            <Store
              className={`h-4 w-4 ${
                esVenta ? "text-green-600" : "text-blue-600"
              }`}
            />
            <p
              className={`text-sm font-semibold ${
                esVenta ? "text-green-900" : "text-blue-900"
              }`}
            >
              {esVenta ? "Disponible en tienda" : "Equipamiento del gimnasio"}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const getCategoriaColor = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes("uniform"))
      return { from: "from-blue-500", to: "to-indigo-600", bg: "bg-blue-500" };
    if (n.includes("dulc"))
      return { from: "from-pink-500", to: "to-rose-600", bg: "bg-pink-500" };
    if (n.includes("mobil") || n.includes("equip"))
      return {
        from: "from-purple-500",
        to: "to-violet-600",
        bg: "bg-purple-500",
      };
    return { from: "from-gray-500", to: "to-gray-600", bg: "bg-gray-500" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section Mejorado */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(74, 222, 128, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 40% 20%, rgba(251, 146, 60, 0.3) 0%, transparent 50%)`,
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="inline-flex items-center justify-center mb-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative bg-white rounded-full p-6 shadow-2xl">
                  <ShoppingBag className="h-16 w-16 text-indigo-600" />
                </div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl md:text-7xl font-extrabold mb-6"
            >
              <span className="text-white">Productos y </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Equipamiento
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl md:text-2xl text-blue-200 max-w-3xl mx-auto mb-10 font-light"
            >
              Todo lo que necesitas está aquí: uniformes oficiales, snacks y el
              mejor equipamiento deportivo profesional
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Badge className="bg-white/10 backdrop-blur-md text-white px-6 py-3 text-base border border-white/20 hover:bg-white/20 transition-all">
                <Sparkles className="mr-2 h-5 w-5" />
                Calidad Premium
              </Badge>
              <Badge className="bg-white/10 backdrop-blur-md text-white px-6 py-3 text-base border border-white/20 hover:bg-white/20 transition-all">
                <Award className="mr-2 h-5 w-5" />
                Productos Oficiales
              </Badge>
              <Badge className="bg-white/10 backdrop-blur-md text-white px-6 py-3 text-base border border-white/20 hover:bg-white/20 transition-all">
                <Package className="mr-2 h-5 w-5" />
                En Stock
              </Badge>
            </motion.div>
          </div>
        </div>

        {/* Decorative wave */}
        <div className="relative">
          <svg
            className="w-full h-20"
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 80C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="space-y-16">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-12 w-64 bg-gray-200 rounded-lg mb-8 animate-pulse" />
                <LoadingSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-20">
            {categorias.map((categoria, idx) => {
              const productos =
                productosPorCategoria[categoria.idcategoria] || [];
              const colores = getCategoriaColor(categoria.nombre);

              return (
                <motion.section
                  key={categoria.idcategoria}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                >
                  {/* Header de categoría */}
                  <div className="mb-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className={`h-1 flex-grow bg-gradient-to-r ${colores.from} ${colores.to} rounded-full`}
                      />
                      <h2 className="text-4xl font-bold text-gray-900 whitespace-nowrap">
                        {categoria.nombre}
                      </h2>
                      <div
                        className={`h-1 flex-grow bg-gradient-to-l ${colores.from} ${colores.to} rounded-full`}
                      />
                    </div>

                    {categoria.descripcion && (
                      <p className="text-center text-lg text-gray-600 max-w-3xl mx-auto">
                        {categoria.descripcion}
                      </p>
                    )}
                  </div>

                  {/* Grid de productos */}
                  {productos.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {productos.map((producto) => (
                          <ProductCard
                            key={producto.idarticulo}
                            articulo={producto}
                            esVenta={categoria.esVenta}
                          />
                        ))}
                      </div>

                      {/* Banner informativo */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className={`p-6 bg-gradient-to-r ${colores.from} ${colores.to} rounded-2xl text-white text-center shadow-xl`}
                      >
                        {categoria.esVenta ? (
                          <>
                            <Store className="h-8 w-8 mx-auto mb-3" />
                            <h3 className="text-xl font-bold mb-2">
                              Adquiere {categoria.nombre.toLowerCase()} en
                              nuestro establecimiento
                            </h3>
                            <p className="text-white/90">
                              Visítanos y encuentra todo lo que necesitas con
                              atención personalizada
                            </p>
                          </>
                        ) : (
                          <>
                            <Eye className="h-8 w-8 mx-auto mb-3" />
                            <h3 className="text-xl font-bold mb-2">
                              Equipamiento profesional disponible
                            </h3>
                            <p className="text-white/90">
                              Nuestro {categoria.nombre.toLowerCase()} está
                              disponible para todos los alumnos durante sus
                              clases
                            </p>
                          </>
                        )}
                      </motion.div>
                    </>
                  ) : (
                    <Card
                      className={`p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100 border-2 ${colores.bg.replace(
                        "bg-",
                        "border-"
                      )}/30`}
                    >
                      <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg text-gray-600">
                        Próximamente tendremos productos en esta categoría
                      </p>
                    </Card>
                  )}
                </motion.section>
              );
            })}
          </div>
        )}

        {/* CTA Final */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20"
        >
          <Card className="overflow-hidden border-0 shadow-2xl">
            <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-12 text-center text-white overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.4) 0%, transparent 50%),
                                  radial-gradient(circle at 80% 80%, rgba(74, 222, 128, 0.4) 0%, transparent 50%)`,
                  }}
                ></div>
              </div>

              <div className="relative">
                <Store className="h-16 w-16 mx-auto mb-6 text-blue-300" />
                <h2 className="text-4xl font-bold mb-4">
                  Visítanos y Descubre Más
                </h2>
                <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
                  Todos nuestros productos están disponibles directamente en el
                  gimnasio. Nuestro personal te atenderá con gusto.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Badge className="bg-white/10 backdrop-blur-md px-6 py-3 text-base border border-white/20">
                    <Package className="mr-2 h-5 w-5" />
                    Productos de calidad
                  </Badge>
                  <Badge className="bg-white/10 backdrop-blur-md px-6 py-3 text-base border border-white/20">
                    <Award className="mr-2 h-5 w-5" />
                    Precios competitivos
                  </Badge>
                  <Badge className="bg-white/10 backdrop-blur-md px-6 py-3 text-base border border-white/20">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Atención personalizada
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </motion.section>
      </div>
    </div>
  );
};

export default Productos;
