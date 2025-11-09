import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Principal from "../secciones/Principal";
import { Dumbbell, Heart, Users, Star, ArrowRight } from "lucide-react";
import logo from "@/assets/LogoGymSerra.png";

const HomePublic = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 overflow-x-hidden">
      {/* 🌀 Animación Parallax de Inicio */}
      <section className="relative w-full h-screen">
        <Principal />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white bg-black/30 backdrop-blur-[2px]">
          <motion.img
            src={logo}
            alt="GymSerra Logo"
            className="w-32 sm:w-40 mb-4 drop-shadow-lg"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          />
          <motion.h1
            className="text-4xl sm:text-6xl font-extrabold tracking-wide mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
          >
            ¡Bienvenido a <span className="text-pink-500">GymSerra!</span>
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl text-gray-200 max-w-2xl mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            Entrena, sueña y supera tus límites en un espacio donde la pasión
            por el deporte se convierte en estilo de vida.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 1 }}
          >
            <Link to="/clases">
              <Button className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-full text-lg shadow-lg">
                Explorar Clases <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 💪 Sección “Quiénes Somos” */}
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

      {/* 🌟 Valores Clave */}
      <section className="py-16 bg-gradient-to-b from-pink-50 to-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-10">
            Nuestros Pilares
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Dumbbell className="h-10 w-10 text-pink-600 mb-4" />,
                title: "Disciplina",
                desc: "El esfuerzo diario y la constancia son la base del éxito.",
              },
              {
                icon: <Users className="h-10 w-10 text-pink-600 mb-4" />,
                title: "Trabajo en Equipo",
                desc: "Nos apoyamos unos a otros para crecer juntos.",
              },
              {
                icon: <Heart className="h-10 w-10 text-pink-600 mb-4" />,
                title: "Pasión",
                desc: "Cada entrenamiento es una oportunidad para amar el proceso.",
              },
              {
                icon: <Star className="h-10 w-10 text-pink-600 mb-4" />,
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

      {/* ❤️ Llamado a la acción */}
      <section className="relative bg-pink-600 py-16 text-white text-center overflow-hidden">
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
          <p className="text-lg text-pink-100 mb-8 max-w-2xl mx-auto">
            Vive una experiencia única donde el cuerpo, la mente y el espíritu
            se unen para crear tu mejor versión.
          </p>
          <Link to="/noticias">
            <Button className="bg-white text-pink-600 hover:bg-pink-50 font-semibold text-lg px-6 py-3 rounded-full shadow-md">
              Ver Noticias y Eventos
            </Button>
          </Link>
        </motion.div>

        {/* Efecto decorativo */}
        <Heart className="absolute bottom-8 right-8 text-pink-300 opacity-30 h-20 w-20 animate-pulse" />
      </section>
    </div>
  );
};

export default HomePublic;
