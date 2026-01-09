import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./modules/Auth/pages/AuthContext";
import ProtectedRoute from "./modules/Auth/pages/ProtectedRoute";
import Login from "./modules/Auth/pages/Login";
import Dashboard from "./modules/dashboard/app/Dashboard";
import Default from "./app/Default";
import NoticiasPublicas from "./components/Pages/NoticiasPublicas";
import SobreNosotros from "./components/Pages/Nosotros";
import HomePublic from "./components/Pages/HomePublic";
import Clases from "./components/Pages/Clases";
import "./App.css";
import Productos from "./components/Pages/Productos";
import Contactos from "./components/Pages/Contactos";
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Default />}>
            <Route index element={<HomePublic />} />
            <Route path="noticias" element={<NoticiasPublicas />} />
            <Route path="sobre-nosotros" element={<SobreNosotros />} />
            <Route path="clases" element={<Clases />} />
            <Route path="productos" element={<Productos />} />
            <Route path="contactos" element={<Contactos />} />
          </Route>
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
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
