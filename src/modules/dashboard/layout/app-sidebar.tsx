"use client";

import * as React from "react";
import {
  Dumbbell,
  PersonStanding,
  Package2,
  SquareTerminal,
  EllipsisVertical,
  Loader2,
  Frame,
  PieChart,
  Map,
} from "lucide-react";

import { NavMain } from "@/modules/dashboard/layout/nav-main";
import { NavUser } from "@/modules/dashboard/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavProjects } from "@/modules/dashboard/layout/nav-projects";

const API_BASE = "http://localhost/GymSerra/public";

type ActiveUser = {
  iduser: number;
  username: string;
  avatar: string | null; // tal cual viene de PHP: "uploads/users/..."
  email: string | null;
  role: string | null;
};

const buildAvatarUrl = (avatar: string | null): string => {
  if (!avatar) return "";
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return `${API_BASE}/${avatar.replace(/^\/+/, "")}`;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<ActiveUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const projects = [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ];
  const navMain = [
    {
      title: "Actividades",
      url: "#",
      icon: Dumbbell,
      items: [
        { title: "Eventos", url: "/dashboard/eventoDashboard" },
        { title: "Noticias", url: "/dashboard/noticiasDashboard" },
      ],
    },
    {
      title: "Inventario",
      url: "/",
      icon: Package2,
      items: [
        { title: "Articulos", url: "/dashboard/articulo" },
        { title: "Ventas", url: "/dashboard/ventas" },
        { title: "Compras", url: "/dashboard/compras" },
        { title: "Proveedores", url: "/dashboard/proveedores" },
        { title: "Ajustes", url: "/dashboard/ajustes" },
      ],
    },
    {
      title: "Horarios",
      url: "/",
      icon: SquareTerminal,
      items: [
        { title: "Horario", url: "/dashboard/horarios" },
        { title: "Planes de pago", url: "/dashboard/planPago" },
      ],
    },
    {
      title: "Administracion de alumnos",
      url: "/",
      icon: PersonStanding,
      items: [
        { title: "Alumnos y tutores", url: "/dashboard/tutores" },
        { title: "Mensualidades", url: "/dashboard/mensualidades" },
      ],
    },
    {
      title: "Detalles",
      url: "/",
      icon: EllipsisVertical,
      items: [
        { title: "Niveles", url: "/dashboard/niveles" },
        { title: "Deportes", url: "/dashboard/deportesDashboard" },
      ],
    },
  ];

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/users.php?action=get_current`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();

        if (data.success && data.user) {
          setUser({
            iduser: data.user.iduser,
            username: data.user.username,
            avatar: data.user.avatar ?? null, // "uploads/users/..."
            email: data.user.correo ?? null,
            role: data.user.rol ?? null,
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error obteniendo usuario activo:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const avatarUrl = user ? buildAvatarUrl(user.avatar) : "";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {loading ? (
          <div className="flex items-center justify-center py-3 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <NavUser
            user={{
              name: user?.username ?? "Invitado",
              avatar: avatarUrl,
              email: user?.email ?? undefined,
              role: user?.role?.trim() || undefined,
            }}
          />
        )}
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={projects} />
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
