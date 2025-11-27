import { useContext } from "react";
import { AuthContext } from "../pages/AuthContextBase";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
