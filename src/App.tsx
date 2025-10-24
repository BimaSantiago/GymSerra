import "./App.css";
import "@/index.css";
import Dashboard from "./components/app/dashboard/Dashboard.tsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Default from "./components/app/Default/Default.tsx";
function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Default />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
