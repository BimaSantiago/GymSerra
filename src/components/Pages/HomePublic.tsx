import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dumbbell, Heart, Users, Star, Zap, Baby } from "lucide-react";
import Principal from "./Principal";
import { ArticulosCarousel } from "./ArticulosCarousel";

const HomePublic = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 overflow-x-hidden">
      {/* Hero con animación */}
      <section className="relative w-full h-screen overflow-hidden">
        <Principal />
      </section>

      {/* Sección “Quiénes Somos” */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-gray-800 mb-6"
          >
            Quiénes Somos
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-gray-600 max-w-3xl mx-auto leading-relaxed text-lg"
          >
            En <span className="font-semibold text-gray-800">GymSerra</span>{" "}
            formamos atletas, soñadores y seres humanos íntegros. A través de la
            gimnasia artística, el parkour y el entrenamiento funcional,
            desarrollamos no solo fuerza física, sino también disciplina,
            respeto y confianza.
          </motion.p>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-10">
            Nuestros Productos
          </h2>
          <ArticulosCarousel />
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-10">
            Nuestros Pilares
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Dumbbell className="h-10 w-10 text-blue-600 mb-4" />,
                title: "Disciplina",
                desc: "El esfuerzo diario y la constancia son la base del éxito.",
              },
              {
                icon: <Users className="h-10 w-10 text-blue-600 mb-4" />,
                title: "Trabajo en Equipo",
                desc: "Nos apoyamos unos a otros para crecer juntos.",
              },
              {
                icon: <Heart className="h-10 w-10 text-blue-600 mb-4" />,
                title: "Pasión",
                desc: "Cada entrenamiento es una oportunidad para amar el proceso.",
              },
              {
                icon: <Star className="h-10 w-10 text-blue-600 mb-4" />,
                title: "Superación",
                desc: "Cada meta alcanzada es un paso más hacia nuestros sueños.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                {item.icon}
                <h3 className="text-xl font-semibold mb-2 text-gray-800">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-gray-600 py-16 text-white text-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative z-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            ¡Únete a nuestra familia GymSerra!
          </h2>
          <p className="text-lg text-gray-100 mb-8 max-w-2xl mx-auto">
            Vive una experiencia única donde el cuerpo, la mente y el espíritu
            se unen para crear tu mejor versión.
          </p>
          <Link to="/noticias">
            <Button className="bg-white text-gray-700 hover:bg-gray-200 font-semibold text-lg px-6 py-3 rounded-full shadow-md">
              Ver Noticias y Eventos
            </Button>
          </Link>
        </motion.div>

        <Heart className="absolute bottom-8 right-8 text-gray-200 opacity-30 h-20 w-20 animate-pulse" />
      </section>

      <section className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-gray-800 mb-10"
          >
            Nuestros Programas
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              {
                titulo: "Gimnasia Artística Inicial",
                desc: "Diseñado para niños y niñas que comienzan su camino en la gimnasia. Desarrolla coordinación, fuerza y confianza en un entorno divertido.",
                icon: (
                  <Baby className="w-14 h-14 text-blue-500" strokeWidth={1.6} />
                ),
                color: "text-blue-500",
              },
              {
                titulo: "Gimnasia Artística",
                desc: "Entrenamientos avanzados que fomentan la técnica, disciplina y rendimiento. Ideal para quienes buscan mejorar su desempeño competitivo.",
                icon: (
                  <Dumbbell
                    className="w-14 h-14 text-pink-500"
                    strokeWidth={1.6}
                  />
                ),
                color: "text-pink-500",
              },
              {
                titulo: "Parkour",
                desc: "Una disciplina urbana que combina fuerza, agilidad y libertad de movimiento. Aprende a superar obstáculos y desafiar tus límites.",
                icon: (
                  <Zap
                    className="w-14 h-14 text-yellow-500"
                    strokeWidth={1.6}
                  />
                ),
                color: "text-yellow-500",
              },
            ].map((programa, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2, duration: 0.7 }}
                viewport={{ once: true }}
                className="relative group overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 bg-white transition-all duration-300 p-8"
              >
                <div className="flex flex-col items-center justify-center space-y-5">
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className={`p-6 rounded-full bg-opacity-10 bg-gray-100 ${programa.color}`}
                  >
                    {programa.icon}
                  </motion.div>

                  <h3 className="text-xl font-bold text-gray-800">
                    {programa.titulo}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 px-4">
                    {programa.desc}
                  </p>

                  <Link to="/clases">
                    <Button
                      variant="outline"
                      className="rounded-full text-blue-600 border-blue-500 hover:bg-blue-100 hover:text-blue-800"
                    >
                      Ver más
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePublic;
