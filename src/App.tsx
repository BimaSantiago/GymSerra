import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/app/dashboard/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/app/dashboard/Login";
import Dashboard from "./components/app/dashboard/Dashboard";
import Default from "./components/app/Default/Default";
import NoticiasPublicas from "./components/secciones/NoticiasPublicas";
import SobreNosotros from "./components/secciones/Nosotros";
import HomePublic from "./components/secciones/HomePublic";
/*
import Eventos from "./components/app/Public/Eventos";

import Productos from "./components/app/Public/Productos";
import "./App.css";
*/
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rutas de login y dashboard protegidas */}
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Default />}>
            <Route index element={<HomePublic />} />
            <Route path="noticias" element={<NoticiasPublicas />} />
            <Route path="sobre-nosotros" element={<SobreNosotros />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
