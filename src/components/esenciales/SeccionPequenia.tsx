import type React from "react";
import Parrafos from "./Parrafos";

type Props = {
  children: React.ReactNode;
  data: string[];
};

const SeccionPequenia = ({ children, data }: Props) => {
  return (
    <article className="flex">
      <div>
        {data.map((item, index) => (
          <Parrafos key={index}>{item}</Parrafos>
        ))}
      </div>
      <div>{children}</div>
    </article>
  );
};

export default SeccionPequenia;
