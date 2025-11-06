"use client";

import * as React from "react";
import {
  Dumbbell,
  PersonStanding,
  Package2,
  SquareTerminal,
  EllipsisVertical,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Actividades",
      url: "#",
      icon: Dumbbell,
      items: [
        {
          title: "Eventos",
          url: "/envio",
        },
        {
          title: "Noticias",
          url: "/pedido",
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
          url: "#",
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
          url: "#",
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
      items: [
        {
          title: "Niveles",
          url: "/dashboard/niveles",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser user={data.user} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
