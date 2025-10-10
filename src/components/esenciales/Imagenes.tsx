type Props = {
  ruta: string;
  pie: string;
  alternativo: string;
};

const Imagenes = ({ ruta, pie, alternativo }: Props) => {
  return (
    <figure>
      <img src={ruta} alt={alternativo} className="rounded-lg shadow-lg" />
      <figcaption className="text-center font-sans text-sm mt-1">
        {pie}
      </figcaption>
    </figure>
  );
};

export default Imagenes;
