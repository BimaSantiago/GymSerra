type Props = { title: string };

const TituloPrin = ({ title }: Props) => {
  return <h1 className="text-3xl font-bold text-center m-2 py-3">{title}</h1>;
};

export default TituloPrin;
