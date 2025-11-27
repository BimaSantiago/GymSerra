type Props = { title: string };

const TituloPrin = ({ title }: Props) => {
  return (
    <h1 className="text-3xl font-sans font-bold text-center py-4 bg-gray-600 text-white">
      {title}
    </h1>
  );
};

export default TituloPrin;
