import { cn } from "@/components/lib/utils";
type Props = {
  ruta: string;
  pie: string;
  alternativo: string;
  altura?: string;
  className?: string;
};

const Imagenes = ({ ruta, pie, alternativo, altura, className }: Props) => {
  return (
    <figure className="max-w-md mx-auto">
      <img
        src={ruta}
        alt={alternativo}
        className={cn("w-full h-auto object-cover rounded-md", className)}
        height={altura}
      />
      <figcaption className="text-center text-sm text-gray-600 mt-2">
        {pie}
      </figcaption>
    </figure>
  );
};

export default Imagenes;
