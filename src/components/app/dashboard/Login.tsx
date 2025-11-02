// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // 🔹 Cambia esta ruta según dónde esté alojado tu login.php
      const response = await fetch(
        "http://localhost/GymSerra/public/api/login.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      // Manejar errores HTTP explícitamente
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("authToken", data.token);
        navigate("/dashboard");
      } else {
        setError(data.message || "Credenciales inválidas");
      }
    } catch (err: unknown) {
      console.error(err);
      setError("Error en la conexión con el servidor");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-muted/30 to-background">
      <Card className="w-full max-w-md shadow-lg border border-border/60 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Iniciar Sesión
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Accede al dashboard del gimnasio
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  placeholder="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <Alert
                variant="destructive"
                className="animate-in fade-in-50 border-red-500/70 bg-red-100/70"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full mt-6 bg-gray-800 hover:bg-gray-600 text-white font-medium"
              type="submit"
            >
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
