import { useState } from "react";
import SubmenuItems from "./SubmenuItems";
import { Button } from "../../ui/button";

const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const mobileMenuClasses = isOpen
    ? "max-h-96 opacity-100 translate-y-0"
    : "max-h-0 opacity-0 -translate-y-4";

  const desktopMenuClasses =
    "md:block md:max-h-none md:opacity-100 md:translate-y-0 md:overflow-visible";

  return (
    <nav className="bg-blue-900 text-white py-3 px-4 fixed w-full z-50 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-wide">Gym Serra</h2>
        <Button
          className="md:hidden focus:outline-none bg-green-800 text-center justify-center items-center"
          onClick={toggleMenu}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isOpen}
        >
          <div className="w-6 h-6 flex justify-center text-center items-center absolute">
            <span
              className={`absolute w-6 h-0.5 bg-white rounded transition-all duration-300 ${
                isOpen ? "rotate-45 top-2.5" : "top-1"
              }`}
            ></span>
            <span
              className={`absolute w-6 h-0.5 bg-white rounded transition-all duration-300 top-3 ${
                isOpen ? "opacity-0" : "opacity-100"
              }`}
            ></span>
            <span
              className={`absolute w-6 h-0.5 bg-white rounded transition-all duration-300 ${
                isOpen ? "-rotate-45 top-2.5" : "top-5"
              }`}
            ></span>
          </div>
        </Button>
      </div>

      {/* Menu items */}
      <div
        className={`transition-all duration-300 overflow-hidden ${mobileMenuClasses} ${desktopMenuClasses}`}
      >
        <SubmenuItems
          data={[
            "Sobre nosotros",
            "Inicio",
            "Clases y horarios",
            "Eventos y Noticias",
            "Otros Servicios",
            "Contáctanos",
          ]}
          paths={[
            "/sobre-nosotros",
            "/",
            "/clases",
            "/noticias",
            "/productos",
            "/contactos",
          ]}
        />
      </div>
    </nav>
  );
};

export default Menu;
