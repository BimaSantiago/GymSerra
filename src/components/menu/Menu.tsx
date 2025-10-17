import TituloPrin from "../esenciales/TituloPrin";
import SubmenuItems from "./SubmenuItems";

const Menu = () => {
  return (
    <>
      <nav className="bg-green-700 text-white p-1">
        <SubmenuItems
          data={["Inicio", "Sobre nosotros", "Noticias", "Comunidad"]}
          paths={["#principal", "#nosotros", "", ""]}
        />
      </nav>
      <TituloPrin title="ACADEMIA GYM SERRA" />
    </>
  );
};

export default Menu;
