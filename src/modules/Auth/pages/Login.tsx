import { useState } from "react";
import { useAuth } from "@/modules/Auth/utils/useAuth";
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
import type { LoginResponse } from "@/modules/Auth/pages/AuthContextBase";

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const data: LoginResponse = await login(username, password);
      if (!data.success) {
        setError(data.message || "Credenciales inválidas");
      }
    } catch (err) {
      console.error(err);
      setError("Error en la conexión con el servidor");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-muted/30 to-background">
      <Card className="md:w-full w-md max-w-3xl aspect-[16/9] shadow-lg border border-border/60 bg-card/95 backdrop-blur-sm grid md:grid-cols-2 py-0">
        <div className="flex flex-col justify-center gap-6 border-r border-border/60">
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
        </div>
        <figure>
          <img src="" alt="" />
        </figure>
      </Card>
    </div>
  );
};

export default Login;
