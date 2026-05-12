"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  } | null;
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
  const normalized = label.trim().toLowerCase();
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
  showContainerGuides = false,
  containerStyles = {},
  user = null,
  links = [
    { label: "Quienes somos", href: "/quienes-somos" },
    { label: "Como acompanamos", href: "/como-acompanamos" },
    { label: "Comunidad", href: "/comunidad" },
    { label: "Blog", href: "/blog" },
    { label: "Admisiones", href: "/admisiones" },
    { label: "Log In", href: "/sign-in" },
  ],
}: LandingNavProps) {
  const [activeSubmenuId, setActiveSubmenuId] = useState<string | null>(null);

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
  const activeSubmenu = navLinksWithSubmenu.find(
    (item, index) => (item.id?.trim() || `nav-${index}`) === activeSubmenuId,
  )?.submenu;

  return (
    <header
      onMouseLeave={() => setActiveSubmenuId(null)}
      className={
        fixed
          ? "font-fira fixed inset-x-0 top-0 z-20 backdrop-blur"
          : "font-fira sticky top-0 z-20 backdrop-blur"
      }
      style={{ backgroundColor, color: textColor }}
    >
      <div
        className="flex w-full items-center justify-between pt-4 pb-0"
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
                      className="transition hover:text-[var(--complement-800)]"
                      onClick={(event) => {
                        if (!item.submenu) {
                          return;
                        }
                        event.preventDefault();
                        setActiveSubmenuId((current) =>
                          current === itemId ? null : itemId,
                        );
                      }}
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
                <Link
                  href="/family-dashboard"
                  className="transition hover:opacity-70"
                  aria-label="Ir a tu cuenta"
                >
                  <Avatar>
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <a
                  href={authLink.href || "#"}
                  className="text-[.8rem] font-semibold tracking-wider transition hover:text-[var(--complement-800)]"
                >
                  {authLink.label}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeSubmenu ? (
        <div className="w-full bg-white px-10 py-8 font-['Roboto_Condensed'] text-black shadow-[0_14px_24px_-18px_rgba(0,0,0,0.45)]">
          <div className="mx-auto flex max-w-[1400px] gap-12">
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
                  className="h-[200px] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
                {activeSubmenu.featured.title ? (
                  <span className="absolute right-4 bottom-4 text-sm font-semibold tracking-wider text-white">
                    {activeSubmenu.featured.title}
                  </span>
                ) : null}
              </a>
            ) : null}

            <div className="grid flex-1 grid-cols-1 gap-10 md:grid-cols-3">
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
