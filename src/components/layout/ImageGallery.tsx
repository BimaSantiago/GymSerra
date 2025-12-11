import { motion } from "framer-motion";

// Usaremos imágenes de placeholder o las que se pasen como props
// En un caso real, estas vendrían de una API o props
const defaultImages = [
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=800&auto=format&fit=crop", // Gym
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800&auto=format&fit=crop", // Fitness
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop", // Weights
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800&auto=format&fit=crop", // Gym girl
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop", // Weights 2
    "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=800&auto=format&fit=crop", // Home workout
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
                                    Gym Serra Momentos
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
