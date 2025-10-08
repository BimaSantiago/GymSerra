import TituloPrin from "../escenciales/TituloPrin";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SubmenuItems from "./SubmenuItems";
import Nosotros from "../secciones/Nosotros";

const Menu = () => {
  return (
    <>
      <BrowserRouter>
        <nav className="bg-green-700 text-white p-1">
          <SubmenuItems
            data={["Inicio", "Sobre nosotros", "Comunidad", "Noticias"]}
            paths={["/", "/nosotros", "/comunidad", "/noticias"]}
          />
        </nav>
        <TituloPrin title="ACADEMIA GYM SERRA" />
        <Routes>
          <Route path="/" element={<h1>Principal</h1>}></Route>
          <Route path="/nosotros" element={<Nosotros></Nosotros>}></Route>
          <Route path="/comunidad" element={<h1>Comunidad</h1>}></Route>
          <Route path="/noticias" element={<h1>Noticias</h1>}></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Menu;
