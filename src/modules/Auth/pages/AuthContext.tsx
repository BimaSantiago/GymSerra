import { useState, useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AuthContext,
  type LoginResponse,
  type AuthUser,
} from "./AuthContextBase";

const API_BASE = "http://localhost/GymSerra/public";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeUserFromApi = (raw: any): AuthUser => {
  // Aseguramos tipos y normalizamos campos
  let avatar: string | null = raw.avatar ?? null;

  if (avatar && !/^https?:\/\//i.test(avatar)) {
    // Si viene como "uploads/users/...", la convertimos en URL absoluta
    avatar = `${API_BASE}/${avatar.replace(/^\/+/, "")}`;
  }

  return {
    iduser: Number(raw.iduser),
    username: String(raw.username ?? ""),
    avatar,
    email: raw.correo ?? raw.email ?? null,
    role: raw.rol ?? raw.role ?? null,
    status: raw.estatus ?? raw.status ?? null,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // ✓ Revisar sesión al cargar la app
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/check_session.php`, {
          credentials: "include",
        });
        const data = await response.json();

        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          setUser(normalizeUserFromApi(data.user));
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // ✓ Proteger rutas /dashboard cuando no hay sesión
  useEffect(() => {
    if (
      !loading &&
      !isAuthenticated &&
      location.pathname.startsWith("/dashboard")
    ) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, location, navigate]);

  const login = async (
    username: string,
    password: string
  ): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE}/api/login.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    const raw = await response.json();

    const result: LoginResponse = {
      success: raw.success,
      message: raw.message,
      user: raw.user ? normalizeUserFromApi(raw.user) : undefined,
    };

    if (result.success) {
      setIsAuthenticated(true);
      setUser(result.user ?? null);
      navigate("/dashboard");
    }

    return result;
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/logout.php`, {
        credentials: "include",
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setTimeout(() => navigate("/login", { replace: true }), 50);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, loading, login, logout }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
