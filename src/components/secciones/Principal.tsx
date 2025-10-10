import Bienvenida from "../../assets/imgPrueba.jpg";

const Principal = () => {
  return (
    <>
      <figure className="flex text-center justify-center items-center">
        <h1 className="absolute text-white font-serif text-8xl font-bold">
          Bienvenido a Gym Serra
        </h1>
        <img
          src={Bienvenida}
          alt="Imagen de Bienvenida"
          className="w-full h-screen"
        />
      </figure>
    </>
  );
};

export default Principal;
