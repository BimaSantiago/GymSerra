import "./App.css";
import Menu from "./components/menu/Menu";
import Nosotros from "./components/secciones/Nosotros";
import Principal from "./components/secciones/Principal";
import Footer from "./components/secciones/Footer";

function App() {
  return (
    <>
      <Menu />
      <Principal />
      <Nosotros />
      <Footer></Footer>
    </>
  );
}

export default App;
