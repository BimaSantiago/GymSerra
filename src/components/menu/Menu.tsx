import TituloPrin from "../escenciales/TituloPrin";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Link } from "react-router-dom";

const Menu = () => {
  return (
    <>
      <BrowserRouter>
        <nav className="bg-green-700 text-white p-4">
          <ul>
            <li>
              <Link to="/">Principal</Link>
            </li>
            <li>
              <Link to="/historia">Historia</Link>
            </li>
            <li>
              <Link to="/mision-vision">Mision y Vision</Link>
            </li>
            <li>
              <Link to="/valores">Valores</Link>
            </li>
            <li>
              <Link to="/comunidad">Comunidad</Link>
            </li>
            <li>
              <Link to="/noticias">Noticias</Link>
            </li>
          </ul>
        </nav>
        <TituloPrin title="ACADEMIA GYM SERRA" />
        <Routes>
          <Route path="/" element={<h1>Principal</h1>}></Route>
          <Route path="/historia" element={<h1>Historia</h1>}></Route>
          <Route
            path="/mision-vision"
            element={<h1>Mision y Vision</h1>}
          ></Route>
          <Route path="/valores"></Route>
          <Route path="/comunidad"></Route>
          <Route path="/noticias"></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Menu;
