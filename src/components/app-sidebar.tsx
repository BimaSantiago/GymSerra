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
      title: "Inventario",
      url: "/",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Ajuste Entrada",
          url: "/clientes",
        },
        {
          title: "Ajuste Salida",
          url: "#",
        },
        {
          title: "Articulos",
          url: "/articulos",
        },
      ],
    },
    {
      title: "Persona",
      url: "/",
      icon: Bot,
      items: [
        {
          title: "Conductores",
          url: "/conductor",
        },
        {
          title: "Clientes",
          url: "/clientes",
        },
        {
          title: "Proveedores",
          url: "/proveedores",
        },
      ],
    },
    {
      title: "Operaciones",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Envio",
          url: "/envio",
        },
        {
          title: "Pedido",
          url: "/pedido",
        },
        {
          title: "Compra a proveedor",
          url: "#",
        },
      ],
    },
    {
      title: "Reportes",
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
          title: "Lo que se pida",
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
          title: "Categorias",
          url: "#",
        },
        {
          title: "Unidades de Medida",
          url: "#",
        },
        {
          title: "Tipos de vehiculo",
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
