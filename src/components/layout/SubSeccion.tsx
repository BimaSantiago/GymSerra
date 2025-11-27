import type React from "react";

type Props = {
  title: string;
  children: React.ReactNode;
};

const SubSeccion = ({ title, children }: Props) => {
  return (
    <section className="mx-auto my-10 max-w-5xl bg-white p-6">
      <h2 className="text-2xl font-sans font-bold text-gray-800 text-center mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
};

export default SubSeccion;
