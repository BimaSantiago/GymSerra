import Bienvenida from "../../assets/imgPrueba.jpg";

const Principal = () => {
  return (
    <section id="principal" className="relative">
      <img
        src={Bienvenida}
        alt="Imagen de Bienvenida"
        className="w-full h-[80vh] object-cover"
      />
      <h1 className="absolute inset-0 flex items-center justify-center text-white font-sans text-5xl md:text-7xl font-bold">
        Bienvenido a Gym Serra
      </h1>
    </section>
  );
};

export default Principal;
