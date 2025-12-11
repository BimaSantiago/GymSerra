import ItemFooter from "./ItemFooter";
import {
  Facebook,
  Instagram,
  Phone,
  Mail,
  MapPin,
  Home,
  Newspaper,
  Info,
  Dumbbell,
  ShoppingBag,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-blue-900 text-gray-100 pt-12 pb-8 border-t border-blue-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {/* Contacto */}
        <div>
          <h3 className="text-white text-xl font-semibold mb-4 border-b border-blue-700 pb-2">
            Contáctanos
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-gray-100" />
              <span>+52 1 55 8260 6391</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-100" />
              <span>contacto@gymserra.com</span>
            </li>
            <li className="flex justify-between items-center gap-2">
              <MapPin className="min-h-5 min-w-5 text-gray-100" />
              <span>
                Avenida Reforma SN, Plaza Reforma tercer piso, 54240 Jilotepec
                de Molina Enríquez, Méx.
              </span>
            </li>
          </ul>

          {/* Redes sociales */}
          <div className="flex gap-4 mt-5">
            <ItemFooter
              ruta="https://www.facebook.com/share/1DMFLc4Zdw/"
              alterno="Facebook"
              icon={<Facebook />}
            />
            <ItemFooter
              ruta="https://www.instagram.com/academia_gym_serra_oficial"
              alterno="Instagram"
              icon={<Instagram />}
            />
          </div>
        </div>

        {/* Acceso rápido */}
        <div>
          <h3 className="text-white text-xl font-semibold mb-4 border-b border-blue-700 pb-2">
            Acceso Rápido
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2 hover:text-white transition">
              <Home className="h-4 w-4 text-gray-100" />
              <a href="/">Inicio</a>
            </li>
            <li className="flex items-center gap-2 hover:text-white transition">
              <ShoppingBag className="h-4 w-4 text-gray-100" />
              <a href="/productos">Productos</a>
            </li>
            <li className="flex items-center gap-2 hover:text-white transition">
              <Dumbbell className="h-4 w-4 text-gray-100" />
              <a href="/clases">Clases</a>
            </li>
            <li className="flex items-center gap-2 hover:text-white transition">
              <Newspaper className="h-4 w-4 text-gray-100" />
              <a href="/noticias">Noticias</a>
            </li>
            <li className="flex items-center gap-2 hover:text-white transition">
              <Info className="h-4 w-4 text-gray-100" />
              <a href="/sobre-nosotros">Sobre Nosotros</a>
            </li>
          </ul>
        </div>

        {/* Información general */}
        <div>
          <h3 className="text-white text-xl font-semibold mb-4 border-b border-blue-700 pb-2">
            Sobre GymSerra
          </h3>
          <p className="text-sm text-gray-100 leading-relaxed">
            En <span className="text-white font-semibold">GymSerra</span>{" "}
            fomentamos el bienestar físico y mental. Ofrecemos clases
            personalizadas, entrenamientos funcionales y una comunidad que te
            impulsa a dar tu mejor versión.
          </p>
        </div>
      </div>

      {/* Línea inferior */}
      <div className="mt-10 border-t border-blue-800 pt-6 text-center text-sm text-blue-200">
        © {new Date().getFullYear()}{" "}
        <span className="text-white font-semibold">GymSerra</span>. Todos los
        derechos reservados.
      </div>
    </footer>
  );
};

export default Footer;
