import { motion } from "framer-motion";
import { Play } from "lucide-react";

const videos = [
    {
        id: 1,
        title: "Entrenamiento Funcional",
        thumbnail:
            "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=800&auto=format&fit=crop",
    },
    {
        id: 2,
        title: "Clase de Gimnasia",
        thumbnail:
            "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=800&auto=format&fit=crop",
    },
    {
        id: 3,
        title: "Parkour en Acción",
        thumbnail:
            "https://images.unsplash.com/photo-1522898467493-49726bf28798?q=80&w=800&auto=format&fit=crop",
    },
    {
        id: 4,
        title: "Fuerza y Resistencia",
        thumbnail:
            "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop",
    },
    {
        id: 5,
        title: "Técnica de Salto",
        thumbnail:
            "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop",
    },
    {
        id: 6,
        title: "Flexibilidad Avanzada",
        thumbnail:
            "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800&auto=format&fit=crop",
    },
    {
        id: 7,
        title: "Competencia Regional",
        thumbnail:
            "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800&auto=format&fit=crop",
    },
    {
        id: 8,
        title: "Entrenamiento Infantil",
        thumbnail:
            "https://images.unsplash.com/photo-1595078475328-1ab05d0a6a0e?q=80&w=800&auto=format&fit=crop",
    },
    {
        id: 9,
        title: "Exhibición de Verano",
        thumbnail:
            "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop",
    },
];

const VideoGallery = () => {
    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl font-bold text-blue-900 mb-4">
                        Nuestros Videos
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Descubre cómo entrenamos y nos divertimos en cada sesión.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {videos.map((video, index) => (
                        <motion.div
                            key={video.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                            viewport={{ once: true }}
                            className="group relative aspect-video cursor-pointer overflow-hidden rounded-2xl shadow-lg"
                        >
                            {/* Thumbnail */}
                            <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />

                            {/* Overlay Oscuro */}
                            <div className="absolute inset-0 bg-blue-900/20 transition-colors group-hover:bg-blue-900/40" />

                            {/* Botón Play */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-600 group-hover:border-blue-400 border border-white/30">
                                    <Play className="h-8 w-8 fill-white text-white ml-1" />
                                </div>
                            </div>

                            {/* Título */}
                            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent">
                                <h3 className="text-white font-semibold text-lg translate-y-2 opacity-90 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                    {video.title}
                                </h3>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default VideoGallery;
