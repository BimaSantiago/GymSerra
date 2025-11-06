import { useState } from "react";
import SubmenuItems from "./SubmenuItems";
import { Button } from "../ui/button";

const Menu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const mobileMenuStateClasses = isOpen
    ? "max-h-96 opacity-100 translate-y-0"
    : "max-h-0 opacity-0 -translate-y-4";

  const desktopMenuClasses =
    "md:block md:max-h-none md:opacity-100 md:translate-y-0 md:overflow-visible";

  return (
    <nav className="bg-gray-800 text-white py-3 px-4 fixed w-full z-50">
      <div className="flex items-center justify-between">
        {/* Hamburger Button (Mobile Only) */}
        <Button
          className="md:hidden p-2 focus:outline-none"
          onClick={toggleMenu}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          <div className="w-6 h-6 relative">
            <span
              className={`absolute w-6 h-0.5 bg-white rounded transition-all duration-400 ease-in-out ${
                isOpen ? "rotate-45 translate-y-0 top-2.5" : "top-1"
              }`}
            ></span>
            <span
              className={`absolute w-6 h-0.5 bg-white rounded transition-all duration-400 ease-in-out top-3 ${
                isOpen ? "opacity-0" : "opacity-100"
              }`}
            ></span>
            <span
              className={`absolute w-6 h-0.5 bg-white rounded transition-all duration-400 ease-in-out ${
                isOpen ? "-rotate-45 translate-y-0 top-2.5" : "top-5"
              }`}
            ></span>
          </div>
        </Button>
      </div>
      {/* Menu Items (Collapsible on Mobile, Always Visible on Laptop) */}
      <div
        className={`transition-all duration-400 ease-in-out overflow-hidden ${mobileMenuStateClasses} ${desktopMenuClasses}`}
      >
        <SubmenuItems
          data={["Inicio", "Sobre nosotros", "Eventos", "Noticias"]}
          paths={["#principal", "#nosotros", "#eventos", "#noticias"]}
        />
      </div>
    </nav>
  );
};

export default Menu;
