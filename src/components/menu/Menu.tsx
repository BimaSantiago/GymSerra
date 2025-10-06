import TituloPrin from "../escenciales/TituloPrin";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Menu = () => {
  return (
    <>
      <TituloPrin title="ACADEMIA GYM SERRA" />
      <BrowserRouter>
        <nav>
          <ul>
            <li></li>
          </ul>
        </nav>
        <Routes>
          <Route></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Menu;
