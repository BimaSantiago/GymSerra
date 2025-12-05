import { createContext } from "react";

export interface AuthUser {
  iduser: number;
  username: string;
  avatar?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: AuthUser;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
