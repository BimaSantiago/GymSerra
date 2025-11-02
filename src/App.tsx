// App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/app/dashboard/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/app/dashboard/Login";
import Dashboard from "./components/app/dashboard/Dashboard";
import Default from "./components/app/Default/Default";

function App() {
  return (
    // ⬇⬇⬇ EL Router debe envolver todo, incluido el AuthProvider
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Default />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
