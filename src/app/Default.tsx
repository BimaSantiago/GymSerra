import { Outlet } from "react-router-dom";
import Menu from "../components/layout/menu/Menu";
import Footer from "../components/layout/footer/Footer";

const Default = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Menu />
      <main className="flex-grow pt-16">
        {" "}
        {/* Padding top para el menú fijo */}
        <Outlet /> {/* Aquí se renderizan las páginas hijas */}
      </main>
      <Footer />
    </div>
  );
};

export default Default;
