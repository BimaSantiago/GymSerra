import React from "react";

type Props = {
  ruta: string;
  alterno: string;
  icon: React.ReactNode;
};

const ItemFooter = ({ ruta, alterno, icon }: Props) => {
  return (
    <a
      href={ruta}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={alterno}
      className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-50 hover:text-white transition-all duration-200"
    >
      {icon}
    </a>
  );
};

export default ItemFooter;
