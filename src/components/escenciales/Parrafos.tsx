import React from "react";

type Props = {
  children: React.ReactNode;
};

function Parrafos({ children }: Props) {
  return <p>{children}</p>;
}

export default Parrafos;
