"use client";

import * as React from "react";
import {
  Dumbbell,
  PersonStanding,
  Package2,
  SquareTerminal,
  EllipsisVertical,
  Loader2,
} from "lucide-react";

import { NavMain } from "@/modules/dashboard/layout/nav-main";
import { NavUser } from "@/modules/dashboard/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

type ActiveUser = {
  iduser: number;
  username: string;
  avatar: string | null;
};

// 🔹 Normaliza la ruta del avatar para evitar rutas relativas rotas al cambiar de vista
function normalizeAvatarPath(path?: string | null): string {
  if (!path) return "/images/default-avatar.png";
  // Si ya es relativa desde raíz, mantenerla
  if (path.startsWith("/")) return path;
  // Si es relativa sin slash (ej. uploads/users/...), agregamos /
  return "/" + path;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<ActiveUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Menú principal
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
      ],
    },
    {
      title: "Inventario",
      url: "/",
      icon: Package2,
      items: [
        {
          title: "Articulos",
          url: "/dashboard/articulo",
        },
        {
          title: "Ventas",
          url: "/dashboard/ventas",
        },
        {
          title: "Compras",
          url: "/dashboard/compras",
        },
        {
          title: "Proveedores",
          url: "/dashboard/proveedores",
        },
        {
          title: "Ajustes",
          url: "/dashboard/ajustes",
        },
      ],
    },
    {
      title: "Horarios",
      url: "/",
      icon: SquareTerminal,
      items: [
        {
          title: "Horario",
          url: "/dashboard/horarios",
        },
        {
          title: "Planes de pago",
          url: "/dashboard/planPago",
        },
      ],
    },
    {
      title: "Administracion de alumnos",
      url: "/",
      icon: PersonStanding,
      items: [
        {
          title: "Alumnos",
          url: "/dashboard/alumnos",
        },
        {
          title: "Tutores",
          url: "/dashboard/tutores",
        },
        {
          title: "Mensualidades",
          url: "/dashboard/mensualidades",
        },
      ],
    },
    {
      title: "Detalles",
      url: "/",
      icon: EllipsisVertical,
      items: [{ title: "Niveles", url: "/dashboard/niveles" }],
    },
  ];

  // Obtener usuario activo desde el backend
  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          "http://localhost/GymSerra/public/api/users.php?action=get_current",
          { credentials: "include" }
        );
        const data = await res.json();

        if (data.success && data.user) {
          setUser({
            iduser: data.user.iduser,
            username: data.user.username,
            avatar: data.user.avatar ?? null,
          });
        } else {
          console.warn("No se encontró usuario activo o sesión inválida");
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

  const avatarPath = normalizeAvatarPath(user?.avatar);

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
              avatar: avatarPath, // ✅ siempre ruta desde raíz
            }}
          />
        )}
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
