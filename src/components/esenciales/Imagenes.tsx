type Props = {
  ruta: string;
  pie: string;
  alternativo: string;
  altura?: string;
};

const Imagenes = ({ ruta, pie, alternativo, altura }: Props) => {
  return (
    <figure className="max-w-md mx-auto">
      <img
        src={ruta}
        alt={alternativo}
        className="w-full h-auto object-cover rounded-md"
        height={altura}
      />
      <figcaption className="text-center text-sm text-gray-600 mt-2">
        {pie}
      </figcaption>
    </figure>
  );
};

export default Imagenes;
