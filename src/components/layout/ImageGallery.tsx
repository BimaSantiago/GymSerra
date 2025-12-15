import { motion } from "framer-motion";
import Imagen10 from "./../../assets/img1familia.svg";
import Imagen11 from "./../../assets/img3pilares.svg";
import Imagen12 from "./../../assets/imgmision (2).svg";
import Imagen13 from "./../../assets/img4pilares.svg";
import Imagen14 from "./../../assets/img1programas.svg";
import Imagen15 from "./../../assets/img2programas.svg";
import Imagen16 from "./../../assets/img2historia.svg";
import Imagen17 from "./../../assets/img1nosostros.svg";
import Imagen18 from "./../../assets/img3programas.svg";
import Imagen19 from "./../../assets/imglogo.svg";

// Usaremos imágenes de placeholder o las que se pasen como props
// En un caso real, estas vendrían de una API o props
const defaultImages = [
  Imagen10,
  Imagen11,
  Imagen13,

  Imagen14,
  Imagen19,
  Imagen16,
  Imagen15,
  Imagen17,
  Imagen18,
  Imagen12,
];

const ImageGallery = ({ images = defaultImages }: { images?: string[] }) => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-blue-900 mb-4">
            Nuestra Galería
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Un vistazo a nuestras instalaciones y a la energía que se vive día a
            día en Gym Serra.
          </p>
        </motion.div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {images.map((src, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 break-inside-avoid"
            >
              <img
                src={src}
                alt={`Galería ${index + 1}`}
                className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <p className="text-white font-medium translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  Recuerdos GymSerra
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImageGallery;
