// SimpleParallax.tsx
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const SimpleParallax = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // ↓↓↓ LAS CAPAS BAJAN (de arriba hacia abajo)
  const yFondo   = useTransform(scrollYProgress, [0, 1], ['0%', '-22%']);
  const yArbol   = useTransform(scrollYProgress, [0, 1], ['0%', '-28%']);
  const ySol     = useTransform(scrollYProgress, [0, 1], ['5%', '-38%']);
  const yAtleta  = useTransform(scrollYProgress, [0, 1], ['5%%', '-80%']);
  const yPasto   = useTransform(scrollYProgress, [0, 1], ['0%', '-22%']);
  const yText   = useTransform(scrollYProgress, [0, 1], ['10%', '-90%']);

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: '170vh' }} 
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* fondo */}
        <motion.div style={{ y: yFondo }} className="absolute inset-0">
          <img src="/img/fondo.png" alt="Fondo" className="w-full h-full object-cover" />
        </motion.div>

        {/* arbol */}
        <motion.div style={{ y: yArbol }} className="absolute inset-0">
          <img src="/img/arbol.png" alt="Árbol" className="w-full h-full object-cover pointer-events-none" />
        </motion.div>

        {/* sol */}
        <motion.div style={{ y: ySol }} className="absolute inset-0">
          <img src="/img/sol.png" alt="Sol" className="w-full h-full object-cover pointer-events-none" />
        </motion.div>

        {/* atleta */}
        <motion.div style={{ y: yAtleta }} className="absolute inset-0">
          <img src="/img/atleta.png" alt="Atleta" className="w-full h-full object-cover pointer-events-none" />
        </motion.div>

        {/* pasto */}
        <motion.div style={{ y: yPasto }} className="absolute inset-0">
          <img src="/img/pasto.png" alt="Pasto" className="w-full h-full object-cover pointer-events-none" />
        </motion.div>

        {/* ttulo */}
        
         <motion.div style={{ y: yText }} className="absolute inset-0">
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
               <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-2xl">
              Gym Serra
              </h1>
            </div>
          </motion.div>
      </div>
    </section>
  );
};

export default SimpleParallax;