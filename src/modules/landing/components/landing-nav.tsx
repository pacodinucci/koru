import Image from "next/image";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type LandingNavProps = {
  backgroundColor?: string;
  textColor?: string;
  heightPx?: number;
  paddingX?: number;
  logoSrc?: string;
  logoAlt?: string;
  links?: Array<{ label: string; href: string }>;
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
    { label: "Escuela para familias", href: "/family-dashboard" },
    { label: "Admisiones", href: "/admisiones" },
    { label: "Log In", href: "/sign-in" },
  ],
}: LandingNavProps) {
  const authLink =
    links.find((item) => {
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
    return normalizedLabel !== "log in" && normalizedHref !== "/sign-in";
  });

  const userDisplay = user?.name?.trim() || user?.email || "Usuario";
  const userInitials = getInitials(userDisplay);

  return (
    <header
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
            <nav className="flex items-center gap-9 text-[.8rem] font-semibold tracking-wider">
              {navLinks.map((item, index) => (
                <a
                  key={`${item.label}-${index}`}
                  href={item.href || "#"}
                  className="transition hover:opacity-70"
                >
                  {item.label}
                </a>
              ))}
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
                  className="text-[.8rem] font-semibold tracking-wider transition hover:opacity-70"
                >
                  {authLink.label}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
