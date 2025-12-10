import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dumbbell, Heart, Users, Star, Zap, Baby } from "lucide-react";
import Principal from "./Principal";
import { ArticulosCarousel } from "./ArticulosCarousel";
import MapaUbicacion from "../layout/Mapa";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const HomePublic = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden">
      {/* Hero */}
      <section className="relative h-screen w-full overflow-hidden">
        <Principal />
      </section>

      {/* Quiénes Somos */}
      <section className="bg-card py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-6 text-3xl font-bold tracking-tight text-foreground"
          >
            Quiénes Somos
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground"
          >
            En <span className="font-semibold text-foreground">GymSerra</span>{" "}
            formamos atletas, soñadores y seres humanos íntegros. A través de la
            gimnasia artística, el parkour y el entrenamiento funcional,
            desarrollamos no solo fuerza física, sino también disciplina,
            respeto y confianza.
          </motion.p>
        </div>
      </section>

      {/* Mapa */}
      <section>
        <MapaUbicacion />
      </section>

      {/* Productos destacados */}
      <section className="bg-gradient-to-b from-background to-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-10 text-center text-3xl font-bold text-foreground">
            Nuestros Productos
          </h2>
          <ArticulosCarousel />
        </div>
      </section>

      {/* Pilares */}
      <section className="bg-gradient-to-b from-muted/30 to-background py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="mb-10 text-3xl font-bold text-foreground">
            Nuestros Pilares
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <Dumbbell className="mb-4 h-10 w-10 text-primary" />,
                title: "Disciplina",
                desc: "El esfuerzo diario y la constancia son la base del éxito.",
              },
              {
                icon: <Users className="mb-4 h-10 w-10 text-primary" />,
                title: "Trabajo en Equipo",
                desc: "Nos apoyamos unos a otros para crecer juntos.",
              },
              {
                icon: <Heart className="mb-4 h-10 w-10 text-primary" />,
                title: "Pasión",
                desc: "Cada entrenamiento es una oportunidad para amar el proceso.",
              },
              {
                icon: <Star className="mb-4 h-10 w-10 text-primary" />,
                title: "Superación",
                desc: "Cada meta alcanzada es un paso más hacia nuestros sueños.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="group rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex flex-col items-center">
                  {item.icon}
                  <h3 className="mb-2 text-xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Noticias */}
      <section className="relative overflow-hidden bg-slate-900 py-16 text-center text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative z-10 mx-auto max-w-3xl px-6"
        >
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            ¡Únete a nuestra familia GymSerra!
          </h2>
          <p className="mb-8 text-lg text-slate-100/90">
            Vive una experiencia única donde el cuerpo, la mente y el espíritu
            se unen para crear tu mejor versión.
          </p>
          <Link to="/noticias">
            <Button className="rounded-full bg-white px-8 py-3 text-lg font-semibold text-slate-900 shadow-md transition-transform hover:-translate-y-0.5 hover:bg-slate-100">
              Ver Noticias y Eventos
            </Button>
          </Link>
        </motion.div>

        <Heart className="absolute bottom-8 right-8 h-20 w-20 animate-pulse text-slate-400/40" />
      </section>

      {/* Programas + sección interactiva */}
      <section className="bg-gradient-to-b from-background to-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-10 text-3xl font-bold text-foreground"
          >
            Nuestros Programas
          </motion.h2>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                titulo: "Gimnasia Artística Inicial",
                desc: "Para niños y niñas que comienzan su camino en la gimnasia. Desarrolla coordinación, fuerza y confianza en un entorno divertido.",
                icon: (
                  <Baby className="h-14 w-14 text-primary" strokeWidth={1.6} />
                ),
              },
              {
                titulo: "Gimnasia Artística",
                desc: "Entrenamientos avanzados que fomentan la técnica, disciplina y rendimiento competitivo.",
                icon: (
                  <Dumbbell
                    className="h-14 w-14 text-pink-500"
                    strokeWidth={1.6}
                  />
                ),
              },
              {
                titulo: "Parkour",
                desc: "Disciplina urbana que combina fuerza, agilidad y libertad de movimiento.",
                icon: (
                  <Zap
                    className="h-14 w-14 text-yellow-500"
                    strokeWidth={1.6}
                  />
                ),
              },
            ].map((programa, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex flex-col items-center justify-center space-y-5">
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="rounded-full bg-muted p-6"
                  >
                    {programa.icon}
                  </motion.div>

                  <h3 className="text-xl font-bold text-foreground">
                    {programa.titulo}
                  </h3>
                  <p className="mb-4 px-4 text-sm leading-relaxed text-muted-foreground">
                    {programa.desc}
                  </p>

                  <Link to="/clases">
                    <Button
                      variant="outline"
                      className="rounded-full border-primary/40 text-primary hover:bg-primary/10"
                    >
                      Ver más
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* FAQ interactivo */}
          <div className="mt-16 text-left">
            <h3 className="mb-4 text-center text-2xl font-semibold text-foreground">
              Preguntas frecuentes
            </h3>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Resolvemos algunas dudas rápidas antes de que te inscribas.
            </p>
            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    ¿A partir de qué edad pueden inscribirse?
                  </AccordionTrigger>
                  <AccordionContent>
                    Contamos con programas desde los 3 años en adelante, con
                    grupos divididos por edad y nivel para que todos entrenen de
                    forma segura y adecuada.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    ¿Necesito experiencia previa en gimnasia o parkour?
                  </AccordionTrigger>
                  <AccordionContent>
                    No es necesario. Tenemos clases de iniciación donde
                    aprenderás desde lo más básico, siempre acompañado por
                    entrenadores capacitados.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    ¿Puedo agendar una clase muestra?
                  </AccordionTrigger>
                  <AccordionContent>
                    Sí, puedes agendar una clase de prueba contactándonos por
                    WhatsApp o redes sociales. ¡Será un gusto recibirte!
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePublic;
