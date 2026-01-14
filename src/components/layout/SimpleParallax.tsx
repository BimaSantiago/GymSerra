import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const SimpleParallax = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const yFondo = useTransform(scrollYProgress, [0, 1], ["0%", "-22%"]);
  const yArbol = useTransform(scrollYProgress, [0, 1], ["0%", "-28%"]);
  const yAtleta = useTransform(scrollYProgress, [0, 1], ["-2%", "-70%"]);

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
      </div>
    </section>
  );
};

export default SimpleParallax;
