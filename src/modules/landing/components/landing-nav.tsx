import Image from "next/image";
import Link from "next/link";

type LandingNavProps = {
  backgroundColor?: string;
  textColor?: string;
  heightPx?: number;
  paddingX?: number;
  logoSrc?: string;
  logoAlt?: string;
  links?: Array<{ label: string; href: string }>;
  fixed?: boolean;
};

export function LandingNav({
  backgroundColor = "#ffffff",
  textColor = "#111111",
  heightPx = 96,
  paddingX = 24,
  logoSrc = "/branding/koru-logo.png",
  logoAlt = "Koru",
  fixed = true,
  links = [
    { label: "Quienes somos", href: "/quienes-somos" },
    { label: "Como acompanamos", href: "/como-acompanamos" },
    { label: "Comunidad", href: "/comunidad" },
    { label: "Blog", href: "/blog" },
    { label: "Escuela para familias", href: "/escuela-para-familias" },
    { label: "Admisiones", href: "/admisiones" },
    { label: "Log In", href: "/sign-in" },
  ],
}: LandingNavProps) {
  const navLinks = links.filter((item) => item.label.trim() !== "");

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

        <div className="hidden lg:flex lg:items-center lg:pt-2">
          <div className="flex items-center gap-9 rounded-md px-2 py-1">
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
          </div>
        </div>
      </div>
    </header>
  );
}
