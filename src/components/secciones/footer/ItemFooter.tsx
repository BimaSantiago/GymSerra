type Props = {
  ruta: string;
  alterno: string;
  socialMedia: string;
};

const ItemFooter = ({ ruta, alterno, socialMedia }: Props) => {
  return (
    <article className="flex flex-col items-center">
      <img src={ruta} alt={alterno} className="w-8 h-8" />
      <p className="text-white text-sm mt-2">{socialMedia}</p>
    </article>
  );
};

export default ItemFooter;
