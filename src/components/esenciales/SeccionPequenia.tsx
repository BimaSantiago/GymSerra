import type React from "react";
import Parrafos from "./Parrafos";

type Props = {
  children: React.ReactNode;
  data: string[];
};

const SeccionPequenia = ({ children, data }: Props) => {
  return (
    <article className="flex">
      <div className="max-w-3/5 p-4">
        {data.map((item, index) => (
          <Parrafos key={index}>{item}</Parrafos>
        ))}
      </div>
      <div className="flex items-center justify-center p-4">{children}</div>
    </article>
  );
};

export default SeccionPequenia;
