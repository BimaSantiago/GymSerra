import { User, ChevronsUpDown, UserRoundCog, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/components/app/dashboard/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    avatar: string;
    email?: string;
  };
}) {
  const { isMobile } = useSidebar();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [openProfile, setOpenProfile] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                {/* 🔹 Avatar circular con fallback */}
                <Avatar className="h-9 w-9 rounded-full border border-gray-200 shadow-sm">
                  <AvatarImage
                    src={user.avatar}
                    alt={user.name}
                    onError={(e) => {
                      e.currentTarget.src = "/images/default-avatar.png";
                    }}
                  />
                  <AvatarFallback className="rounded-full bg-gray-200 text-gray-600">
                    {user.name ? user.name[0].toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                  <span className="truncate font-medium">{user.name}</span>
                </div>

                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="min-w-56 rounded-lg bg-white shadow-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 px-3 py-2 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage
                      src={user.avatar}
                      alt={user.name}
                      onError={(e) => {
                        e.currentTarget.src = "/images/default-avatar.png";
                      }}
                    />
                    <AvatarFallback className="rounded-full bg-gray-200 text-gray-600">
                      {user.name ? user.name[0].toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setOpenProfile(true)}>
                  <User className="mr-2" />
                  Perfil
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate("/dashboard/users")}>
                  <UserRoundCog className="mr-2" />
                  Administrar usuarios
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* 🔹 Dialog de Perfil */}
      <Dialog open={openProfile} onOpenChange={setOpenProfile}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">
              Perfil de Usuario
            </DialogTitle>
          </DialogHeader>

          <Card className="shadow-none border-0 text-center">
            <CardContent className="flex flex-col items-center justify-center space-y-4 py-6">
              <Avatar className="h-28 w-28 rounded-full border-2 border-gray-300 shadow-md">
                <AvatarImage
                  src={user.avatar}
                  alt={user.name}
                  onError={(e) => {
                    e.currentTarget.src = "/images/default-avatar.png";
                  }}
                />
                <AvatarFallback className="rounded-full bg-gray-200 text-gray-600 text-3xl">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-xl font-semibold text-gray-800">
                {user.name}
              </h2>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}
