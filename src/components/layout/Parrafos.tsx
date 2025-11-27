import React from "react";

type Props = {
  children: React.ReactNode;
};

function Parrafos({ children }: Props) {
  return <p className="text-base text-gray-700 my-2">{children}</p>;
}

export default Parrafos;
