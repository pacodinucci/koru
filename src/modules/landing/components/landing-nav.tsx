"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type LandingSubmenuLink = {
  label: string;
  href: string;
};

type LandingSubmenuColumn = {
  title: string;
  links: LandingSubmenuLink[];
};

type LandingSubmenu = {
  columns: LandingSubmenuColumn[];
  featured?: {
    imageSrc: string;
    imageAlt: string;
    title?: string;
    href?: string;
  };
};

type LandingNavLink = {
  id?: string;
  label: string;
  href: string;
  submenu?: LandingSubmenu;
};

type LandingNavProps = {
  backgroundColor?: string;
  textColor?: string;
  heightPx?: number;
  paddingX?: number;
  logoSrc?: string;
  logoAlt?: string;
  links?: LandingNavLink[];
  fixed?: boolean;
  disableScrollBackgroundChange?: boolean;
  showContainerGuides?: boolean;
  containerStyles?: Record<
    string,
    {
      width: number;
      height: number;
      paddingX: number;
      paddingY: number;
      marginX: number;
      marginY: number;
    }
  >;
  user?: {
    name: string;
    email: string;
    role?: "ADMIN" | "TEACHER" | "PARENT";
  } | null;
  onSignOut?: (formData: FormData) => void;
};

function getInitials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "U";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getDefaultSubmenuByLabel(label: string): LandingSubmenu | undefined {
  const normalized = label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized === "como acompanamos") {
    return {
      featured: {
        imageSrc: "/assets/img1.jpg",
        imageAlt: "Cómo acompañamos",
        title: "Cómo acompañamos",
        href: "/como-acompanamos",
      },
      columns: [
        {
          title: "Cómo acompañamos",
          links: [
            {
              label: "Grupo Esporas",
              href: "/como-acompanamos#grupo-esporas",
            },
            {
              label: "Grupo Koru",
              href: "/como-acompanamos#grupo-koru",
            },
            {
              label: "Grupo Helechos 1",
              href: "/como-acompanamos#grupo-helechos-1",
            },
            {
              label: "Grupo Helechos 2",
              href: "/como-acompanamos#grupo-helechos-2",
            },
          ],
        },
      ],
    };
  }

  if (normalized !== "comunidad") {
    return undefined;
  }

  return {
    featured: {
      imageSrc: "/assets/img1.jpg",
      imageAlt: "Comunidad Koru",
      title: "Comunidad Koru",
      href: "/comunidad",
    },
    columns: [
      {
        title: "Comunidad",
        links: [
          { label: "Nuestra comunidad", href: "/comunidad#nuestra-comunidad" },
          {
            label: "Escuela para familias",
            href: "/comunidad#escuela-para-familias",
          },
          { label: "Únete al equipo", href: "/comunidad#unete-al-equipo" },
        ],
      },
    ],
  };
}

export function LandingNav({
  backgroundColor = "#ffffff",
  textColor = "#111111",
  heightPx = 96,
  paddingX = 24,
  logoSrc = "/branding/koru-logo.png",
  logoAlt = "Koru",
  fixed = true,
  disableScrollBackgroundChange = false,
  showContainerGuides = false,
  containerStyles = {},
  user = null,
  onSignOut,
  links = [
    { label: "Quiénes somos", href: "/quienes-somos" },
    { label: "Cómo acompañamos", href: "/como-acompanamos" },
    { label: "Comunidad", href: "/comunidad" },
    { label: "Blog", href: "/blog" },
    { label: "Admisiones", href: "/admisiones" },
    { label: "Contacto", href: "/contacto" },
    { label: "Log In", href: "/sign-in" },
  ],
}: LandingNavProps) {
  const mobileMenuBackgroundColor = "#343c11";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileUserDrawerOpen, setIsMobileUserDrawerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeUserMenu, setActiveUserMenu] = useState<
    "desktop" | "mobile" | null
  >(null);
  const closeUserMenuTimeoutRef = useRef<number | null>(null);

  function clearUserMenuCloseTimeout() {
    if (!closeUserMenuTimeoutRef.current) {
      return;
    }

    window.clearTimeout(closeUserMenuTimeoutRef.current);
    closeUserMenuTimeoutRef.current = null;
  }

  function openUserMenu(menu: "desktop" | "mobile") {
    clearUserMenuCloseTimeout();
    setActiveUserMenu(menu);
  }

  function scheduleUserMenuClose(menu: "desktop" | "mobile") {
    clearUserMenuCloseTimeout();
    closeUserMenuTimeoutRef.current = window.setTimeout(() => {
      setActiveUserMenu((current) => (current === menu ? null : current));
      closeUserMenuTimeoutRef.current = null;
    }, 1000);
  }

  useEffect(() => {
    if (!fixed || disableScrollBackgroundChange) {
      return;
    }

    const onScroll = () => {
      setIsScrolled(window.scrollY >= 200);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [fixed, disableScrollBackgroundChange]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsMounted(true), 0);
    return () => {
      window.clearTimeout(timeoutId);
      clearUserMenuCloseTimeout();
    };
  }, []);

  const isTransparentNav =
    backgroundColor.trim().toLowerCase() === "transparent";
  const effectiveIsScrolled = fixed && !disableScrollBackgroundChange && isScrolled;
  const effectiveBackgroundColor =
    effectiveIsScrolled ? "#ffffff" : backgroundColor;
  const effectiveTextColor =
    fixed && !effectiveIsScrolled && isTransparentNav ? "#ffffff" : textColor;
  const shouldUseBackdropBlur =
    fixed
      ? !(isTransparentNav && !effectiveIsScrolled)
      : !isTransparentNav;
  const resolvedHeaderBackgroundColor = effectiveBackgroundColor;

  const [activeSubmenuId, setActiveSubmenuId] = useState<string | null>(null);
  const hasActiveSubmenu = activeSubmenuId !== null;

  const authLink = links.find((item) => {
    const normalizedLabel = item.label.trim().toLowerCase();
    const normalizedHref = (item.href ?? "").trim().toLowerCase();
    return normalizedLabel === "log in" || normalizedHref === "/sign-in";
  }) ?? { label: "Log In", href: "/sign-in" };

  const navLinks = links.filter((item) => {
    if (item.label.trim() === "") {
      return false;
    }
    const normalizedLabel = item.label.trim().toLowerCase();
    const normalizedHref = (item.href ?? "").trim().toLowerCase();
    return (
      normalizedLabel !== "log in" &&
      normalizedHref !== "/sign-in" &&
      normalizedLabel !== "escuela para familias"
    );
  });
  const navLinksWithSubmenu = navLinks.map((item) => ({
    ...item,
    submenu: item.submenu ?? getDefaultSubmenuByLabel(item.label),
  }));

  const userDisplay = user?.name?.trim() || user?.email || "Usuario";
  const userInitials = getInitials(userDisplay);
  const isAdmin = user?.role === "ADMIN";
  const activeSubmenu = navLinksWithSubmenu.find(
    (item, index) => (item.id?.trim() || `nav-${index}`) === activeSubmenuId,
  )?.submenu;


  function renderUserDropdown(
    menu: "desktop" | "mobile",
    triggerClassName = "h-12 gap-3 rounded-md bg-transparent px-3 pr-4 font-['Montserrat'] text-sm font-semibold shadow-none transition hover:bg-transparent aria-expanded:bg-transparent aria-expanded:text-current",
  ) {
    const isMobileUserMenu = menu === "mobile";

    return (
      <DropdownMenu
        open={activeUserMenu === menu}
        onOpenChange={(open) => setActiveUserMenu(open ? menu : null)}
      >
        <div
          onMouseEnter={isMobileUserMenu ? undefined : () => openUserMenu(menu)}
          onMouseLeave={
            isMobileUserMenu ? undefined : () => scheduleUserMenuClose(menu)
          }
        >
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                className={triggerClassName}
                aria-label="Abrir men? de usuario"
              />
            }
          >
            <Avatar className="h-9 w-9 border border-black/5">
              <AvatarFallback className="bg-[#f3d889] text-xs font-semibold text-slate-950">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[110px] truncate">{userDisplay}</span>
            <ChevronDown className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={14}
            className="w-[300px] rounded-lg border border-black/10 bg-white p-3 font-['Montserrat'] text-slate-950 shadow-[0_18px_50px_-20px_rgba(15,23,42,0.45)]"
            onMouseEnter={isMobileUserMenu ? undefined : () => openUserMenu(menu)}
            onMouseLeave={
              isMobileUserMenu ? undefined : () => scheduleUserMenuClose(menu)
            }
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex flex-col items-center px-3 pt-2 pb-5 text-center">
                  <Avatar className="h-16 w-16 border border-black/5 shadow-sm">
                    <AvatarFallback className="bg-[#f3d889] text-base font-semibold text-slate-950">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="mt-4 grid max-w-full leading-tight">
                    <span className="truncate text-sm font-bold">
                      {userDisplay}
                    </span>
                    <span className="mt-1 truncate text-xs text-slate-500">
                      {user?.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuGroup className="space-y-2">
              <DropdownMenuItem
                render={<Link href="/family-dashboard" />}
                className="h-12 rounded-md px-4 text-sm font-medium text-slate-950 focus:bg-slate-100 focus:text-slate-950"
              >
                <Users />
                Family dashboard
              </DropdownMenuItem>
              {isAdmin ? (
                <DropdownMenuItem
                  render={<Link href="/dashboard" />}
                  className="h-12 rounded-md px-4 text-sm font-medium text-slate-950 focus:bg-slate-100 focus:text-slate-950"
                >
                  <ShieldCheck />
                  Admin dashboard
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
            {onSignOut ? (
              <>
                <DropdownMenuSeparator className="my-4 bg-transparent" />
                <form action={onSignOut} className="px-1 pb-1">
                  <button
                    type="submit"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-black/10 bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                  >
                    <LogOut />
                    Cerrar sesi?n
                  </button>
                </form>
              </>
            ) : null}
          </DropdownMenuContent>
        </div>
      </DropdownMenu>
    );
  }

  function renderMobileUserDrawer() {
    return (
      <Drawer
        open={isMobileUserDrawerOpen}
        onOpenChange={setIsMobileUserDrawerOpen}
      >
        <DrawerTrigger asChild>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-transparent px-2 font-['Montserrat'] text-sm font-semibold shadow-none transition hover:bg-transparent"
            aria-label="Abrir menú de usuario"
          >
            <Avatar className="h-9 w-9 border border-black/5">
              <AvatarFallback className="bg-[#f3d889] text-xs font-semibold text-slate-950">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[96px] truncate">{userDisplay}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </DrawerTrigger>
        <DrawerContent className="rounded-t-lg border-t border-black/10 bg-white font-['Montserrat'] text-slate-950">
          <DrawerHeader className="items-center px-6 pt-6 pb-3 text-center">
            <Avatar className="h-16 w-16 border border-black/5 shadow-sm">
              <AvatarFallback className="bg-[#f3d889] text-base font-semibold text-slate-950">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <DrawerTitle className="mt-3 text-sm font-bold text-slate-950">
              {userDisplay}
            </DrawerTitle>
            <DrawerDescription className="text-xs text-slate-500">
              {user?.email}
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-2 px-4 pb-2">
            <Link
              href="/family-dashboard"
              onClick={() => setIsMobileUserDrawerOpen(false)}
              className="flex h-12 items-center gap-2 rounded-md px-4 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
            >
              <Users className="h-4 w-4" />
              Family dashboard
            </Link>
            {isAdmin ? (
              <Link
                href="/dashboard"
                onClick={() => setIsMobileUserDrawerOpen(false)}
                className="flex h-12 items-center gap-2 rounded-md px-4 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin dashboard
              </Link>
            ) : null}
          </div>
          {onSignOut ? (
            <DrawerFooter className="px-4 pt-2 pb-5">
              <form action={onSignOut}>
                <button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-black/10 bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:outline-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                >
                  <LogOut />
                  Cerrar sesión
                </button>
              </form>
            </DrawerFooter>
          ) : null}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <header
      onMouseLeave={() => setActiveSubmenuId(null)}
      className={
        fixed
          ? `font-fira fixed inset-x-0 top-0 z-20 transition-[background-color,backdrop-filter] duration-300 ${shouldUseBackdropBlur || hasActiveSubmenu ? "backdrop-blur" : ""}`
          : `font-fira sticky top-0 z-20 transition-[background-color,backdrop-filter] duration-300 ${shouldUseBackdropBlur || hasActiveSubmenu ? "backdrop-blur" : ""}`
      }
      style={{ backgroundColor: resolvedHeaderBackgroundColor, color: effectiveTextColor }}
    >
      <div
        className="flex w-full items-center justify-between py-0"
        style={{
          minHeight: `${heightPx}px`,
          paddingLeft: `${paddingX}px`,
          paddingRight: `${paddingX}px`,
        }}
      >
        <div
          data-nav-container-id="navbar-logo"
          className={
            showContainerGuides
              ? "inline-flex items-center rounded-sm border-2 border-dashed border-[var(--complement-700)] px-2 py-1"
              : "inline-flex items-center"
          }
          style={{
            width:
              (containerStyles["navbar-logo"]?.width ?? 0) > 0
                ? `${containerStyles["navbar-logo"]?.width}px`
                : undefined,
            minHeight:
              (containerStyles["navbar-logo"]?.height ?? 0) > 0
                ? `${containerStyles["navbar-logo"]?.height}px`
                : undefined,
            paddingLeft: `${containerStyles["navbar-logo"]?.paddingX ?? 0}px`,
            paddingRight: `${containerStyles["navbar-logo"]?.paddingX ?? 0}px`,
            paddingTop: `${containerStyles["navbar-logo"]?.paddingY ?? 0}px`,
            paddingBottom: `${containerStyles["navbar-logo"]?.paddingY ?? 0}px`,
            marginLeft: `${containerStyles["navbar-logo"]?.marginX ?? 0}px`,
            marginRight: `${containerStyles["navbar-logo"]?.marginX ?? 0}px`,
            marginTop: `${containerStyles["navbar-logo"]?.marginY ?? 0}px`,
            marginBottom: `${containerStyles["navbar-logo"]?.marginY ?? 0}px`,
          }}
        >
          <Link href="/" className="inline-flex items-center">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={1536}
              height={1024}
              className="h-16 w-auto"
              priority
            />
          </Link>
        </div>

        <div className="hidden lg:flex lg:items-center lg:pt-2">
          <div
            data-nav-container-id="navbar-nav-options"
            className={
              showContainerGuides
                ? "flex items-center gap-9 rounded-md border-2 border-dashed border-[var(--complement-700)] px-2 py-1"
                : "flex items-center gap-9 rounded-md px-2 py-1"
            }
            style={{
              width:
                (containerStyles["navbar-nav-options"]?.width ?? 0) > 0
                  ? `${containerStyles["navbar-nav-options"]?.width}px`
                  : undefined,
              minHeight:
                (containerStyles["navbar-nav-options"]?.height ?? 0) > 0
                  ? `${containerStyles["navbar-nav-options"]?.height}px`
                  : undefined,
              paddingLeft: `${containerStyles["navbar-nav-options"]?.paddingX ?? 0}px`,
              paddingRight: `${containerStyles["navbar-nav-options"]?.paddingX ?? 0}px`,
              paddingTop: `${containerStyles["navbar-nav-options"]?.paddingY ?? 0}px`,
              paddingBottom: `${containerStyles["navbar-nav-options"]?.paddingY ?? 0}px`,
              marginLeft: `${containerStyles["navbar-nav-options"]?.marginX ?? 0}px`,
              marginRight: `${containerStyles["navbar-nav-options"]?.marginX ?? 0}px`,
              marginTop: `${containerStyles["navbar-nav-options"]?.marginY ?? 0}px`,
              marginBottom: `${containerStyles["navbar-nav-options"]?.marginY ?? 0}px`,
            }}
          >
            <nav className="flex items-center gap-9 font-['Roboto_Condensed'] text-[1rem] font-semibold tracking-wider">
              {navLinksWithSubmenu.map((item, index) => {
                const itemId = item.id?.trim() || `nav-${index}`;
                return (
                  <div
                    key={`${item.label}-${index}`}
                    className="relative"
                    onMouseEnter={() => {
                      if (item.submenu) {
                        setActiveSubmenuId(itemId);
                      } else {
                        setActiveSubmenuId(null);
                      }
                    }}
                  >
                    <a
                      href={item.href || "#"}
                      className="transition-colors duration-300 hover:text-[var(--complement-800)]"
                      onClick={() => setActiveSubmenuId(null)}
                    >
                      {item.label}
                    </a>
                  </div>
                );
              })}
            </nav>
            <div
              data-nav-container-id="navbar-auth-slot"
              className={
                showContainerGuides
                  ? "ml-6 flex items-center rounded-sm border-2 border-dashed border-[var(--complement-700)] px-2 py-1"
                  : "ml-6 flex items-center"
              }
            >
              {user ? (
                renderUserDropdown("desktop")
              ) : (
                <a
                  href={authLink.href || "#"}
                  className="text-[.8rem] font-semibold tracking-wider transition-colors duration-300 hover:text-[var(--complement-800)]"
                >
                  {authLink.label}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {user ? renderMobileUserDrawer() : null}
          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${isMobileMenuOpen ? "text-white" : ""}`}
          >
            <span className="sr-only">Menú</span>
            <span className="relative block h-4 w-6">
              <span
                className={`absolute left-0 h-[2px] w-6 bg-current transition-all duration-300 ${isMobileMenuOpen ? "top-[7px] rotate-45" : "top-0"}`}
              />
              <span
                className={`absolute top-[7px] left-0 h-[2px] w-6 bg-current transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : "opacity-100"}`}
              />
              <span
                className={`absolute left-0 h-[2px] w-6 bg-current transition-all duration-300 ${isMobileMenuOpen ? "top-[7px] -rotate-45" : "top-[14px]"}`}
              />
            </span>
          </button>
        </div>
      </div>

      {isMounted
        ? createPortal(
            <div
              className={`fixed inset-0 z-[15] lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
              style={{
                backgroundColor: mobileMenuBackgroundColor,
                color: "#ffffff",
                width: "100vw",
                height: "100dvh",
                minHeight: "100dvh",
              }}
            >
              <div className="flex h-full w-full flex-col items-center justify-center px-6 py-10 text-center">
                <nav className="flex flex-col items-center justify-center gap-8 font-['Roboto_Condensed'] text-2xl font-semibold tracking-wide text-white">
                  {navLinksWithSubmenu.map((item, index) => (
                    <a
                      key={`${item.label}-${index}`}
                      href={item.href || "#"}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="transition-colors duration-200 hover:text-white/80"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
                {!user ? (
                  <div className="pt-8 text-center">
                    <a
                      href={authLink.href || "#"}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="font-['Roboto_Condensed'] text-lg font-semibold tracking-wider text-white transition-colors duration-200 hover:text-white/80"
                    >
                      {authLink.label}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}

      {activeSubmenu ? (
        <div
          className={`w-full px-10 py-8 font-['Roboto_Condensed'] shadow-[0_14px_24px_-18px_rgba(0,0,0,0.45)] transition-[background-color,backdrop-filter] duration-300 backdrop-blur`}
          style={{ backgroundColor: effectiveBackgroundColor, color: effectiveTextColor }}
        >
          <div className="mx-auto flex min-h-[260px] max-w-[1400px] items-stretch gap-12">
            {activeSubmenu.featured ? (
              <a
                href={activeSubmenu.featured.href || "#"}
                className="group relative hidden w-[320px] shrink-0 overflow-hidden md:block"
              >
                <Image
                  src={activeSubmenu.featured.imageSrc}
                  alt={activeSubmenu.featured.imageAlt}
                  width={640}
                  height={640}
                  className="h-full min-h-[200px] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
                {activeSubmenu.featured.title ? (
                  <span className="absolute right-4 bottom-4 text-sm font-semibold tracking-wider text-white">
                    {activeSubmenu.featured.title}
                  </span>
                ) : null}
              </a>
            ) : null}

            <div className="grid flex-1 content-start grid-cols-1 gap-10 md:grid-cols-3">
              {activeSubmenu.columns.map((column) => (
                <div key={column.title} className="space-y-3">
                  <p className="text-sm font-bold tracking-[0.2em] uppercase">
                    {column.title}
                  </p>
                  <ul className="space-y-2">
                    {column.links.map((link) => (
                      <li key={`${column.title}-${link.label}`}>
                        <a
                          href={link.href || "#"}
                          className="text-[1.25rem] leading-8 transition hover:text-[var(--complement-800)]"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}


