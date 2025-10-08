type Props = { title: string };

const TituloPrin = ({ title }: Props) => {
  return (
    <h1 className="text-3xl font-bold text-center py-5 bg-green-800 text-white">
      {title}
    </h1>
  );
};

export default TituloPrin;
