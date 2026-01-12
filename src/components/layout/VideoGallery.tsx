import { motion } from "framer-motion";

// Import videos
import vid1 from "../../assets/videos/WhatsApp Video 2026-01-08 at 4.03.59 PM.mp4";
import vid2 from "../../assets/videos/WhatsApp Video 2026-01-08 at 4.03.59 PM (1).mp4";
import vid3 from "../../assets/videos/WhatsApp Video 2026-01-08 at 4.03.59 PM (2).mp4";
import vid4 from "../../assets/videos/WhatsApp Video 2026-01-08 at 4.03.59 PM (3).mp4";
import vid5 from "../../assets/videos/WhatsApp Video 2026-01-08 at 4.03.59 PM (4).mp4";
import vid6 from "../../assets/videos/WhatsApp Video 2026-01-08 at 4.03.59 PM (5).mp4";
import vid7 from "../../assets/videos/WhatsApp Video 2026-01-08 at 4.03.59 PM (6).mp4";
import vid8 from "../../assets/videos/WhatsApp Video 2026-01-08 at 4.03.59 PM (7).mp4";
import vid9 from "../../assets/videos/WhatsApp Video 2026-01-08 at 4.03.59 PM (8).mp4";
import vid10 from "../../assets/videos/WhatsApp Video 2026-01-08 at 4.03.59 PM (9).mp4";
import vid11 from "../../assets/videos/WhatsApp Video 2026-01-08 at 4.03.59 PM (10).mp4";
import vid12 from "../../assets/videos/WhatsApp Video 2026-01-08 at 4.03.59 PM (11).mp4";

const videos = [
  { id: 1, title: "Entrenamiento Funcional", src: vid1 },
  { id: 2, title: "Clase de Gimnasia", src: vid2 },
  { id: 3, title: "Parkour en Acción", src: vid3 },
  { id: 4, title: "Fuerza y Resistencia", src: vid4 },
  { id: 5, title: "Técnica de Salto", src: vid5 },
  { id: 6, title: "Flexibilidad Avanzada", src: vid6 },
  { id: 7, title: "Competencia Regional", src: vid7 },
  { id: 8, title: "Entrenamiento Infantil", src: vid8 },
  { id: 9, title: "Exhibición de Verano", src: vid9 },
  { id: 10, title: "Entrenamiento Intensivo", src: vid10 },
  { id: 11, title: "Rutina de Cardio", src: vid11 },
  { id: 12, title: "Estiramientos", src: vid12 },
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
              className="group relative aspect-video cursor-pointer overflow-hidden rounded-2xl shadow-lg bg-black"
            >
              <video
                src={video.src}
                controls
                className="w-full h-full object-cover"
                preload="metadata"
              >
                Tu navegador no soporta el elemento de video.
              </video>

              {/* Título (opcional, si quieres que aparezca sobre el video antes de reproducir) */}
              {/* <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                                <h3 className="text-white font-semibold text-sm">
                                    {video.title}
                                </h3>
                            </div> */}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoGallery;
