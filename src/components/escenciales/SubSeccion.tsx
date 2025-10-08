import type React from "react";

type Props = {
  title: string;
  children: React.ReactNode;
};

const SubSeccion = ({ title, children }: Props) => {
  return (
    <article className="mx-auto my-5 shadow-xl max-w-11/12 bg-green-50 rounded-2xl p-4">
      <h2 className="text-3xl font-serif font-semibold text-center">{title}</h2>
      {children}
    </article>
  );
};

export default SubSeccion;
