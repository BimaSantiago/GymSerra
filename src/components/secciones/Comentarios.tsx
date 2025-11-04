import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, Calendar } from "lucide-react";

// Datos de ejemplo para comentarios
const EXAMPLE_COMMENTS = [
  {
    id: 1,
    name: "Ana López",
    date: new Date("2025-10-10T14:30:00"),
    content:
      "¡La clase de gimnasia artística fue increíble! Mi hija está muy emocionada por seguir entrenando.",
  },
  {
    id: 2,
    name: "Carlos Méndez",
    date: new Date("2025-10-15T09:15:00"),
    content:
      "El taller de parkour fue todo un éxito. ¡Gracias por motivar a los jóvenes!",
  },
  {
    id: 3,
    name: "María González",
    date: new Date("2025-10-18T17:00:00"),
    content:
      "Felicidades por el segundo lugar en el Nacional de Gimnasia. ¡Orgullosos de Gym Serra!",
  },
];

type Comment = {
  id: number;
  name: string;
  date: Date;
  content: string;
};

const Comentarios = () => {
  const [comments, setComments] = useState<Comment[]>(EXAMPLE_COMMENTS);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    const newComment: Comment = {
      id: comments.length + 1,
      name: name.trim(),
      date: new Date(),
      content: content.trim(),
    };

    // Simula guardar en la base de datos (futuro POST a /api/comments)
    setComments([newComment, ...comments]);
    setName("");
    setContent("");
    setError("");
    // En producción, enviar a PHP endpoint:
    // fetch('/api/comments', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(newComment),
    // });
  };

  return (
    <section id="comunidad" className="py-10 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-sans font-bold text-center text-gray-800 mb-8">
          Comunidad Gym Serra
        </h2>

        {/* Formulario de Comentarios */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Deja tu comentario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Textarea
                  placeholder="Escribe tu comentario..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-gray-800 hover:bg-gray-600 text-white font-medium"
                variant="outline"
              >
                Publicar Comentario
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Comentarios */}
        <div className="space-y-6">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <Card
                key={comment.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-600" />
                      <span className="font-semibold text-gray-800">
                        {comment.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {comment.date.toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <User className="mx-auto h-12 w-12 opacity-50 mb-2" />
              <p>No hay comentarios aún.</p>
              <p className="text-sm mt-1">
                ¡Sé el primero en compartir tu experiencia con Gym Serra!
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Comentarios;
