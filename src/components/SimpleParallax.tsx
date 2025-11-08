// src/components/SimpleParallax.tsx

import { Parallax, ParallaxLayer } from '@react-spring/parallax';

const SimpleParallax = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Parallax pages={1.5} className="h-full">
        {/* Fondo */}
        <ParallaxLayer offset={0} speed={0.1}>
          <img
            src="/img/fondo.png"
            alt="Fondo"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </ParallaxLayer>

        {/* arbol */}
        <ParallaxLayer offset={0} speed={0.4}>
          <img
            src="/img/arbol.png"
            alt="Árbol"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </ParallaxLayer>

        {/* Sol */}
        <ParallaxLayer offset={0} speed={0.7}>
          <img
            src="/img/sol.png"
            alt="Sol"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </ParallaxLayer>

        {/* Atleta */}
        <ParallaxLayer offset={0} speed={0.9}>
          <img
            src="/img/atleta.png"
            alt="Atleta"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </ParallaxLayer>

        {/* Pasto */}
        <ParallaxLayer offset={0} speed={1.1}>
          <img
            src="/img/pasto.png"
            alt="Pasto"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </ParallaxLayer>
      </Parallax>
    </div>
  );
};

export default SimpleParallax;