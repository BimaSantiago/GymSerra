// AuthContextBase.tsx
import { createContext } from "react";

export interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

// Exporta solo el contexto (sin componentes)
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
