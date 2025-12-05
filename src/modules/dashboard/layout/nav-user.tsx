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
import { useAuth } from "@/modules/Auth/utils/useAuth";
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
    avatar: string; // aquí ya viene la URL ABSOLUTA desde AppSidebar
    email?: string;
    role?: string;
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

  const normalizedRole = (user.role || "").trim().toLowerCase();
  const isAdmin =
    normalizedRole === "administrador" || normalizedRole === "admin";

  const initial = user.name ? user.name[0].toUpperCase() : "U";
  const avatarSrc =
    user.avatar && user.avatar.trim() !== "" ? user.avatar : undefined;

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
                <Avatar className="h-9 w-9 rounded-full border border-gray-200 shadow-sm">
                  <AvatarImage src={avatarSrc} alt={user.name} />
                  <AvatarFallback className="rounded-full bg-gray-200 text-gray-600">
                    {initial}
                  </AvatarFallback>
                </Avatar>

                <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                  <span className="truncate font-medium">{user.name}</span>
                  {user.email && (
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  )}
                  {user.role && (
                    <span className="truncate text-xs text-muted-foreground">
                      Rol: {user.role}
                    </span>
                  )}
                </div>

                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="min-w-56 rounded-lg shadow-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 px-3 py-2 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage src={avatarSrc} alt={user.name} />
                    <AvatarFallback className="rounded-full bg-gray-200 text-gray-100">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    {user.email && (
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    )}
                    {user.role && (
                      <span className="truncate text-xs text-muted-foreground">
                        Rol: {user.role}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setOpenProfile(true)}>
                  <User className="mr-2" />
                  Perfil
                </DropdownMenuItem>

                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => navigate("/dashboard/users")}
                  >
                    <UserRoundCog className="mr-2" />
                    Administrar usuarios
                  </DropdownMenuItem>
                )}
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

      {/* Dialog de Perfil */}
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
                <AvatarImage src={avatarSrc} alt={user.name} />
                <AvatarFallback className="rounded-full bg-gray-200 text-gray-100 text-3xl">
                  {initial}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-xl font-semibold text-gray-200">
                {user.name}
              </h2>

              {user.email && (
                <p className="text-sm text-gray-100">{user.email}</p>
              )}

              {user.role && (
                <p className="text-xs font-medium text-gray-100">
                  Rol: {user.role}
                </p>
              )}
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}
