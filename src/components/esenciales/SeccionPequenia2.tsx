import type React from "react";
import Parrafos from "./Parrafos";

type Props = {
  children: React.ReactNode;
  data: string[];
};

const SeccionPequenia2 = ({ children, data }: Props) => {
  return (
    <article className="flex">
      <div>{children}</div>
      <div>
        {data.map((item, index) => (
          <Parrafos key={index}>{item}</Parrafos>
        ))}
      </div>
    </article>
  );
};

export default SeccionPequenia2;
