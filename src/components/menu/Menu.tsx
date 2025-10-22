import TituloPrin from "../esenciales/TituloPrin";
import SubmenuItems from "./SubmenuItems";

const Menu = () => {
  return (
    <>
      <nav className="bg-gray-800 text-white py-3 px-4">
        <SubmenuItems
          data={["Inicio", "Sobre nosotros", "Noticias", "Comunidad"]}
          paths={["#principal", "#nosotros", "#noticias", "#comunidad"]}
        />
      </nav>
      <TituloPrin title="Academia Gym Serra" />
    </>
  );
};

export default Menu;
