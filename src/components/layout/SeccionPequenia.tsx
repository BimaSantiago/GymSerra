import type React from "react";
import Parrafos from "./Parrafos";

type Props = {
  children: React.ReactNode;
  data: string[];
};

const SeccionPequenia = ({ children, data }: Props) => {
  return (
    <article className="flex flex-col md:flex-row gap-6 py-6">
      <div className="md:w-3/5">
        {data.map((item, index) => (
          <Parrafos key={index}>{item}</Parrafos>
        ))}
      </div>
      <div className="flex items-center justify-center">{children}</div>
    </article>
  );
};

export default SeccionPequenia;
