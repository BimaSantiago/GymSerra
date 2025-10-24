import ItemFooter from "./ItemFooter";

const Footer = () => {
  return (
    <footer className="bg-gray-800 py-6">
      <h3 className="text-white text-center font-sans font-bold text-2xl mb-4">
        Contáctanos
      </h3>
      <div className="flex justify-center gap-8">
        <ItemFooter ruta="" alterno="Whatsapp" socialMedia="Enviar Mensaje" />
        <ItemFooter ruta="" alterno="Instagram" socialMedia="Instagram" />
        <ItemFooter ruta="" alterno="Facebook" socialMedia="Facebook" />
      </div>
    </footer>
  );
};

export default Footer;
