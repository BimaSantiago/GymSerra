type Props = {
  ruta: string;
  pie: string;
  alternativo: string;
  altura?: string;
};

const Imagenes = ({ ruta, pie, alternativo, altura }: Props) => {
  return (
    <figure>
      <img
        src={ruta}
        alt={alternativo}
        className="rounded-lg shadow-lg"
        height={altura}
      />
      <figcaption className="text-center font-sans text-sm mt-1">
        {pie}
      </figcaption>
    </figure>
  );
};

export default Imagenes;
