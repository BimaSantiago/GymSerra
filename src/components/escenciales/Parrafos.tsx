import React from "react";

type Props = {
  children: React.ReactNode;
};

function Parrafos({ children }: Props) {
  return <p className="max-w-3/4 text-lg my-3 mx-3 p-1">{children}</p>;
}

export default Parrafos;
