import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Routes, Route } from "react-router-dom";
import AlumnosDashboard from "./Secciones/AlumnosDashboard";
import ArticulosDashboard from "./Secciones/ArticulosDashboard";
import HorariosDashboard from "./Secciones/HorariosDashboard";
import NivelesDashboard from "./Secciones/NivelesDashboard";
import TutoresDashboard from "./Secciones/TutoresDashboard";
import ProveedoresDashboard from "./Secciones/ProveeedoresDashboard";
import Compras from "./Secciones/Compras";
import ComprasDetalle from "./Secciones/ComprasDetalle";
import PlanPagoDashboard from "./Secciones/PlanPagoDashboard";
import MensualidadesDashboard from "./Secciones/MensualidadesDashboard";
export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Routes>
            <Route path="/alumnos" element={<AlumnosDashboard />} />
            <Route path="/articulo" element={<ArticulosDashboard />} />
            <Route path="/horarios" element={<HorariosDashboard />} />
            <Route path="/niveles" element={<NivelesDashboard />} />
            <Route path="/tutores" element={<TutoresDashboard />} />
            <Route path="/proveedores" element={<ProveedoresDashboard />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/comprasDetalle" element={<ComprasDetalle />} />
            <Route path="/planPago" element={<PlanPagoDashboard />} />
            <Route path="/mensualidades" element={<MensualidadesDashboard />} />
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
