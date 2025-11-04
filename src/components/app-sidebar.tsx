"use client";

import * as React from "react";
import { BookOpen, Bot, Settings2, SquareTerminal } from "lucide-react";

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
      title: "Horarios",
      url: "/",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Horario",
          url: "/clientes",
        },
        {
          title: "Promociones",
          url: "#",
        },
        {
          title: "Planes de pago",
          url: "/articulos",
        },
      ],
    },
    {
      title: "Administracion de alumnos",
      url: "/",
      icon: Bot,
      items: [
        {
          title: "Tutores",
          url: "/conductor",
        },
        {
          title: "Alumnos",
          url: "/clientes",
        },
      ],
    },
    {
      title: "Actividades",
      url: "#",
      icon: BookOpen,
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
      icon: Settings2,
      items: [
        {
          title: "Ventas",
          url: "#",
        },
        {
          title: "Compras",
          url: "#",
        },
        {
          title: "Articulos",
          url: "#",
        },
        {
          title: "Proveedores",
          url: "#",
        },
        {
          title: "Ajustes",
          url: "#",
        },
      ],
    },
    {
      title: "Detalles",
      url: "/",
      icon: Settings2,
      items: [
        {
          title: "Niveles",
          url: "#",
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
