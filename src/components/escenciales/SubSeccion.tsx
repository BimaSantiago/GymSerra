type Props = {
  title: string;
};

const SubSeccion = ({ title }: Props) => {
  return (
    <article>
      <h2>{title}</h2>
    </article>
  );
};

export default SubSeccion;
