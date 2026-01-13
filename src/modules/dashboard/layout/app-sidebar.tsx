"use client";

import * as React from "react";
import {
  Dumbbell,
  PersonStanding,
  Package2,
  Milk,
  Loader2,
  ChartNoAxesCombined,
  UsersRound,
  Waypoints,
  Trophy,
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
import { ModeToggle } from "./mode-toggle";

const API_BASE = "https://academiagymserra.garzas.store";

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
      name: "Contactos",
      url: "/dashboard/contactos",
      icon: Waypoints,
    },
    {
      name: "Niveles",
      url: "/dashboard/niveles",
      icon: ChartNoAxesCombined,
    },
    {
      name: "Deportes",
      url: "/dashboard/deportesDashboard",
      icon: Trophy,
    },
  ];
  const navMain = [
    {
      title: "Actividades",
      url: "#",
      icon: Dumbbell,
      items: [
        {
          title: "Eventos",
          url: "/dashboard/eventoDashboard",
        },
        {
          title: "Noticias",
          url: "/dashboard/noticiasDashboard",
        },
        {
          title: "Horario",
          url: "/dashboard/horarios",
        },
      ],
    },
    {
      title: "Articulos",
      url: "/",
      icon: Milk,
      items: [
        {
          title: "Articulos",
          url: "/dashboard/articulo",
        },
        {
          title: "Unidades de Medida",
          url: "/dashboard/unidades",
        },
        {
          title: "Categorias",
          url: "/dashboard/categorias",
        },
      ],
    },
    {
      title: "Administracion de alumnos",
      url: "/",
      icon: PersonStanding,
      items: [
        {
          title: "Alumnos y tutores",
          url: "/dashboard/tutores",
        },
        {
          title: "Planes de pago",
          url: "/dashboard/planPago",
        },
        {
          title: "Mensualidades",
          url: "/dashboard/mensualidades",
        },
        {
          title: "Clases de prueba",
          url: "/dashboard/clase-prueba",
        },
      ],
    },
    {
      title: "Inventario",
      url: "/",
      icon: Package2,
      items: [
        {
          title: "Ajustes",
          url: "/dashboard/ajustes",
        },
        {
          title: "Compras",
          url: "/dashboard/compras",
        },
        {
          title: "Ventas",
          url: "/dashboard/ventas",
        },
        {
          title: "Cortes de caja",
          url: "/dashboard/corteCaja",
        },
      ],
    },
    {
      title: "Personas",
      url: "/",
      icon: UsersRound,
      items: [
        {
          title: "Cliente",
          url: "/dashboard/clientes",
        },
        {
          title: "Proveedores",
          url: "/dashboard/proveedores",
        },
        {
          title: "Instructores",
          url: "/dashboard/instructores",
        },
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

      <ModeToggle />

      <SidebarRail />
    </Sidebar>
  );
}
