import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
//import { Link } from "react-router-dom";
//import { Button } from "@/components/ui/button";
//import { ArrowRight } from "lucide-react";

const SimpleParallax = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Capas con diferentes velocidades
  const yFondo = useTransform(scrollYProgress, [0, 1], ["0%", "-22%"]);
  const yArbol = useTransform(scrollYProgress, [0, 1], ["0%", "-28%"]);
  const yAtleta = useTransform(scrollYProgress, [0, 1], ["-2%", "-70%"]);
  /* const yPasto = useTransform(scrollYProgress, [0, 1], ["0%", "-22%"]); */

  // Movimiento del texto (ligero hacia arriba)
  /*const yTexto = useTransform(scrollYProgress, [0, 1], ["0%", "-45%"]);
  const opacityTexto = useTransform(scrollYProgress, [0, 0.8], [1, 0]);*/

  return (
    <section ref={containerRef} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* fondo */}
        <motion.div style={{ y: yFondo }} className="absolute inset-0">
          <img
            src="/img/fondo.png"
            alt="Fondo"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* arbol */}
        <motion.div style={{ y: yArbol }} className="absolute inset-0">
          <img
            src="/img/estrellas.png"
            alt="Árbol"
            className="w-full h-full object-cover pointer-events-none"
          />
        </motion.div>

        {/* atleta */}
        <motion.div style={{ y: yAtleta }} className="absolute inset-0">
          <img
            src="/img/atleta.png"
            alt="Atleta"
            className="w-full h-full object-cover pointer-events-none"
          />
        </motion.div>

        {/* pasto 
        <motion.div style={{ y: yPasto }} className="absolute inset-0">
          <img
            src="/img/pasto.png"
            alt="Pasto"
            className="w-full h-full object-cover pointer-events-none"
          />
        </motion.div> */}

       {/* <motion.div
          style={{ y: yTexto, opacity: opacityTexto }}
          className="absolute inset-0 flex flex-col items-center justify-center text-center text-white z-20 px-4"
        > */}
        {/*
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-lg sm:text-xl text-gray-200 mb-2 tracking-wide"
          >
            ¡Bienvenido a tu espacio de crecimiento y superación!
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="text-5xl sm:text-7xl font-extrabold mb-6 drop-shadow-lg"
          >
            <span className="text-white">Gym</span>
            <span className="text-white">Serra</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="max-w-2xl text-gray-200 text-lg mb-8"
          >
            Vive la experiencia de transformar cuerpo, mente y espíritu a través
            del deporte, la disciplina y la pasión.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <Link to="/clases">
              <Button className="bg-blue-900 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-full shadow-lg backdrop-blur-md">
                Explorar Clases <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>  */}
      </div>
    </section>
   
  );
};

export default SimpleParallax;
