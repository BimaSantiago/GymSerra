type Props = {
  ruta: string;
  pie: string;
  alternativo: string;
};

const Imagenes = ({ ruta, pie, alternativo }: Props) => {
  return (
    <figure>
      <img src={ruta} alt={alternativo} />
      <figcaption>{pie}</figcaption>
    </figure>
  );
};

export default Imagenes;
