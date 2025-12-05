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
    <nav className="bg-gray-800 text-white py-3 px-4 fixed w-full z-50 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-wide">GymSerra</h2>
        <Button
          className="md:hidden p-2 focus:outline-none"
          onClick={toggleMenu}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isOpen}
        >
          <div className="w-6 h-6 relative">
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
          data={["Inicio", "Productos", "Clases", "Noticias", "Sobre nosotros"]}
          paths={["/", "/productos", "/clases", "/noticias", "/sobre-nosotros"]}
        />
      </div>
    </nav>
  );
};

export default Menu;
