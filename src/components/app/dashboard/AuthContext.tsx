import { useState, useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext, type LoginResponse } from "./AuthContextBase";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(
          "http://localhost/GymSerra/public/api/check_session.php",
          {
            credentials: "include",
          }
        );
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

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
    const response = await fetch(
      "http://localhost/GymSerra/public/api/login.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      }
    );

    const data: LoginResponse = await response.json();
    if (data.success) {
      setIsAuthenticated(true);
      navigate("/dashboard");
    }
    return data;
  };

  const logout = async () => {
    try {
      await fetch("http://localhost/GymSerra/public/api/logout.php", {
        credentials: "include",
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setIsAuthenticated(false);
      setTimeout(() => navigate("/login", { replace: true }), 50);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
