"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ChevronUp,
  ClipboardList,
  FileText,
  Handshake,
  Home,
  Images,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Newspaper,
  Sprout,
  Settings2,
  TrendingUp,
  User2,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { signOutAction } from "@/modules/auth/server/auth-actions";

const mainItems = [
  { title: "Inicio", href: "/family-dashboard", icon: Home },
  { title: "Calendario", href: "/family-dashboard/calendario", icon: CalendarDays },
  { title: "Mensajes", href: "/family-dashboard/mensajes", icon: MessageSquare },
];

const studentItems = [
  { title: "Expediente de cada niñ@", href: "/family-dashboard/expediente", icon: FileText },
  { title: "Avances de tu hij@", href: "/family-dashboard/avances", icon: TrendingUp },
  { title: "Ecociclos", href: "/family-dashboard/ecociclos", icon: Sprout },
  {
    title: "Acuerdos de seguimiento",
    href: "/family-dashboard/acuerdos-seguimiento",
    icon: Handshake,
  },
  { title: "Reportes", href: "/family-dashboard/reportes", icon: ClipboardList },
  {
    title: "Evidencias de avance",
    href: "/family-dashboard/evidencias",
    icon: Images,
  },
];

const communityItems = [
  {
    title: "Blog interno de proyectos",
    href: "/family-dashboard/blog-interno",
    icon: BookOpen,
  },
  {
    title: "Boletín de unidades",
    href: "/family-dashboard/boletin-unidades",
    icon: Newspaper,
  },
  {
    title: "Fotos comunidad",
    href: "/family-dashboard/fotos-comunidad",
    icon: Users,
  },
  {
    title: "Fotos de proyectos personales",
    href: "/family-dashboard/proyectos-personales",
    icon: Images,
  },
];

const sidebarMenuButtonClass = "hover:bg-[color-mix(in_srgb,var(--brand-600)_14%,white)] hover:text-[var(--brand-700)] data-active:bg-[color-mix(in_srgb,var(--brand-600)_14%,white)] data-active:text-[var(--brand-700)]";

const supportItems = [
  { title: "Soporte", href: "/family-dashboard/soporte", icon: LifeBuoy },
  { title: "Configuracion", href: "/family-dashboard/configuracion", icon: Settings2 },
];

type FamilySidebarProps = {
  userName: string;
  userEmail: string;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "U";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/family-dashboard" && pathname.startsWith(`${href}/`));
}

export function FamilySidebar({ userName, userEmail }: FamilySidebarProps) {
  const pathname = usePathname();
  const userInitials = getInitials(userName);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <div className="flex items-center justify-center px-3 py-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2">
          <Link href="/" aria-label="Volver al inicio">
            <Image
              src="/branding/koru-logo.png"
              alt="Koru"
              width={120}
              height={34}
              className="h-8 w-auto object-contain group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7"
              priority
            />
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Escuela para familias</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    }
                    isActive={isActivePath(pathname, item.href)}
                    className={sidebarMenuButtonClass}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Seguimiento de tu hij@</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {studentItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    }
                    isActive={isActivePath(pathname, item.href)}
                    className={sidebarMenuButtonClass}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Comunidad y proyectos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {communityItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    }
                    isActive={isActivePath(pathname, item.href)}
                    className={sidebarMenuButtonClass}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    }
                    isActive={isActivePath(pathname, item.href)}
                    className={sidebarMenuButtonClass}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <SidebarMenuButton
                render={<DropdownMenuTrigger />}
                size="lg"
                className={sidebarMenuButtonClass}
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{userName}</span>
                  <span className="truncate text-xs">{userEmail}</span>
                </div>
                <ChevronUp className="ml-auto size-4" />
              </SidebarMenuButton>
              <DropdownMenuContent
                className="w-56 rounded-lg [font-family:var(--font-montserrat)]"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{userName}</span>
                        <span className="truncate text-xs">{userEmail}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User2 />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings2 />
                    Configuración
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="group/dropdown-menu-item relative flex w-full cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive"
                  >
                    <LogOut />
                    Cerrar sesion
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
