import { AppSidebar } from "@/modules/dashboard/layout/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Routes, Route } from "react-router-dom";
import AlumnosDashboard from "../../alumnos/pages/AlumnosDashboard";
import ArticulosDashboard from "../../inventario/pages/ArticulosDashboard";
import HorariosDashboard from "../pages/HorariosDashboard";
import NivelesDashboard from "../../detalles/pages/NivelesDashboard";
import TutoresDashboard from "../../alumnos/pages/TutoresDashboard";
import ProveedoresDashboard from "../../inventario/pages/ProveeedoresDashboard";
import Compras from "../../inventario/pages/Compras";
import ComprasDetalle from "../../inventario/pages/ComprasDetalle";
import PlanPagoDashboard from "../pages/PlanPagoDashboard";
import MensualidadesDashboard from "../../alumnos/pages/MensualidadesDashboard";
import UsersDashboard from "../../admin/page/UsersDashboard";
import Ventas from "../../inventario/pages/Ventas";
import VentasDetalle from "../../inventario/pages/VentasDetalle";
import Ajustes from "../../inventario/pages/Ajustes";
import AjustesDetalle from "../../inventario/pages/AjustesDetalle";
import EventDashboard from "../../actividades/pages/EventDashboard";
import NoticiasDashboard from "../../actividades/pages/NoticiasDashboard";
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
            <Route path="/users" element={<UsersDashboard />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/ventasDetalle" element={<VentasDetalle />} />
            <Route path="/ajustes" element={<Ajustes />} />
            <Route path="/ajustesDetalle" element={<AjustesDetalle />} />
            <Route path="/eventoDashboard" element={<EventDashboard />} />
            <Route path="/noticiasDashboard" element={<NoticiasDashboard />} />
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
