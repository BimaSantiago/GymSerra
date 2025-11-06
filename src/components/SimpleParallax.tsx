import { Parallax, ParallaxLayer } from '@react-spring/parallax';

const SimpleParallax = () => {
  return (
    <div className=" overflow-hidden w-full h-[600px] bg-orange-400">
      <Parallax className='max-h-[600px]' pages={1.7}>
        {/* Fondo */}
        <ParallaxLayer offset={0} speed={0.013}>
          <img
            src="/img/fondo.png"
            alt="Fondo"
            className="absolute w-full h-full object-cover inset-0 overflow-visible "
          />
        </ParallaxLayer>

        {/* Sol */}
        <ParallaxLayer offset={0} speed={0.95}>
          <img
            src="/img/sol.png"
            alt="Sol"
            className="absolute inset-0 w-full h-full object-cover overflow-visible"
          />
        </ParallaxLayer>

        {/* Atleta */}
        <ParallaxLayer offset={0} speed={0.99}>
          <img
            src="/img/atleta.png"
            alt="Atleta"
            className="absolute inset-0 w-full h-full object-cover  overflow-visible"
          />
        </ParallaxLayer>

        {/* Árbol */}
        <ParallaxLayer className=" top-3" offset={0} speed={0.55}>
          <img
            src="/img/arbol.png"
            alt="Árbol"
            className="absolute inset-0 w-full h-full object-cover  overflow-visible"
          />
        </ParallaxLayer>

        {/* Pasto */}
        <ParallaxLayer offset={0} speed={0.70}>
          <img
            src="/img/pasto.png"
            alt="Pasto"
            className="absolute inset-0 w-full h-full object-cover overflow-visible"
          />
        </ParallaxLayer>

      </Parallax>
    </div>
  );
};

export default SimpleParallax;