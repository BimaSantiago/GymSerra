import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Store,
  Package,
  Eye,
  Sparkles,
  TrendingUp,
  Gift,
  Star,
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
      whileHover={{ y: -8 }}
    >
      <Card className="group h-full overflow-hidden border-2 border-gray-200 hover:border-blue-900 hover:shadow-2xl transition-all duration-300">
        <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <img
            src={articulo.img || "/uploads/articulos/default.jpg"}
            alt={articulo.nombre}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src = "/uploads/articulos/default.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <Badge
            className={`absolute top-3 right-3 ${
              esVenta
                ? "bg-green-800 hover:bg-green-900"
                : "bg-blue-900 hover:bg-blue-950"
            } text-white border-0 shadow-lg`}
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
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-900 transition-colors">
            {articulo.nombre}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-3 mb-4">
            {articulo.descripcion}
          </p>
          <div
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 ${
              esVenta
                ? "bg-green-50 border-green-800"
                : "bg-blue-50 border-blue-900"
            }`}
          >
            <Store
              className={`h-4 w-4 ${
                esVenta ? "text-green-800" : "text-blue-900"
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

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section Renovado */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        {/* Patrón de fondo animado */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`,
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Contenido izquierdo */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-white"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="inline-block mb-6"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-300" />
                    <span className="font-semibold">Productos GymSerra</span>
                  </div>
                </div>
              </motion.div>

              <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
                Todo lo que
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-400">
                  Necesitas en un
                </span>
                Solo Lugar
              </h1>

              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Descubre nuestra selección de uniformes, snacks deliciosos y el
                mejor equipamiento deportivo. ¡Todo disponible en nuestro
                gimnasio!
              </p>

              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                >
                  <ShoppingBag className="h-8 w-8 text-green-300 mb-2" />
                  <div className="text-2xl font-bold">10+</div>
                  <div className="text-sm text-blue-200">Productos</div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                >
                  <TrendingUp className="h-8 w-8 text-yellow-300 mb-2" />
                  <div className="text-2xl font-bold">Premium</div>
                  <div className="text-sm text-blue-200">Calidad</div>
                </motion.div>
              </div>
            </motion.div>

            {/* Tarjetas flotantes derecha */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative h-[500px]">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute top-0 right-0 w-64"
                >
                  <Card className="bg-white shadow-2xl border-2 border-green-700 overflow-hidden">
                    <div className="h-32 bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center">
                      <ShoppingBag className="h-16 w-16 text-white" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2 text-green-700">
                        Uniformes Oficiales
                      </h3>
                      <p className="text-sm text-gray-600">
                        Diseños exclusivos para todos los niveles
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  className="absolute top-32 left-0 w-64"
                >
                  <Card className="bg-white shadow-2xl border-2 border-blue-800 overflow-hidden">
                    <div className="h-32 bg-gradient-to-br from-green-800 to-green-700 flex items-center justify-center">
                      <Gift className="h-16 w-16 text-white" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2 text-blue-900">
                        Dulcería Saludable
                      </h3>
                      <p className="text-sm text-gray-600">
                        Snacks nutritivos después del entrenamiento
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="absolute bottom-0 right-12 w-64"
                >
                  <Card className="bg-white shadow-2xl border-2 overflow-hidden border-green-800">
                    <div className="h-32 bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center">
                      <Package className="h-16 w-16 text-white" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2 text-green-700">
                        Equipamiento Pro
                      </h3>
                      <p className="text-sm text-gray-600">
                        Material de primera calidad
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wave decorativa */}
        <div className="relative">
          <svg className="w-full h-16" viewBox="0 0 1440 120" fill="none">
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
              const isVenta = categoria.esVenta;

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
                        className={`h-1 flex-grow ${
                          isVenta ? "bg-green-800" : "bg-blue-900"
                        } rounded-full`}
                      />
                      <h2 className="text-4xl font-bold text-gray-900 whitespace-nowrap">
                        {categoria.nombre}
                      </h2>
                      <div
                        className={`h-1 flex-grow ${
                          isVenta ? "bg-green-800" : "bg-blue-900"
                        } rounded-full`}
                      />
                    </div>

                    {categoria.descripcion && (
                      <p className="text-center text-lg text-gray-600 max-w-3xl mx-auto">
                        {categoria.descripcion}
                      </p>
                    )}
                  </div>
                  {/* Banner informativo */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className={`p-8 mb-6 ${
                      isVenta ? "bg-green-800" : "bg-blue-900"
                    } rounded-2xl text-white text-center shadow-xl`}
                  >
                    {categoria.esVenta ? (
                      <>
                        <Store className="h-10 w-10 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-3">
                          Adquiere {categoria.nombre.toLowerCase()} en nuestro
                          establecimiento
                        </h3>
                        <p className="text-white/90 text-lg">
                          Visítanos y encuentra todo lo que necesitas con
                          atención personalizada
                        </p>
                      </>
                    ) : (
                      <>
                        <Eye className="h-10 w-10 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-3">
                          Equipamiento profesional disponible
                        </h3>
                        <p className="text-white/90 text-lg">
                          Nuestro {categoria.nombre.toLowerCase()} está
                          disponible para todos los alumnos durante sus clases
                        </p>
                      </>
                    )}
                  </motion.div>
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
                    </>
                  ) : (
                    <Card className="p-12 text-center bg-gray-50 border-2 border-gray-200">
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
            <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-12 text-center text-white">
              <Store className="h-16 w-16 mx-auto mb-6 text-green-300" />
              <h2 className="text-4xl font-bold mb-4">
                Visítanos y Descubre Más
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Todos nuestros productos están disponibles directamente en el
                gimnasio. Nuestro personal te atenderá con gusto.
              </p>
              <div className="flex flex-wrap justify-center gap-4 ">
                <Badge className="bg-white/10 text-white backdrop-blur-md px-6 py-3 text-base border border-white/20 hover:bg-white/20 transition-all">
                  <Package className="mr-2 h-5 w-5" />
                  Productos de calidad
                </Badge>
                <Badge className="bg-white/10 text-white backdrop-blur-md px-6 py-3 text-base border border-white/20 hover:bg-white/20 transition-all">
                  <Star className="mr-2 h-5 w-5" />
                  Precios competitivos
                </Badge>
                <Badge className="bg-white/10 text-white backdrop-blur-md px-6 py-3 text-base border border-white/20 hover:bg-white/20 transition-all">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Atención personalizada
                </Badge>
              </div>
            </div>
          </Card>
        </motion.section>
      </div>
    </div>
  );
};

export default Productos;
