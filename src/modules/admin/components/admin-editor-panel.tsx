"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type AdminEditorPanelContextValue = {
  open: boolean;
  setOpen: (next: boolean) => void;
  toggleOpen: () => void;
  portalTarget: HTMLDivElement | null;
  setDesktopPortalTarget: (node: HTMLDivElement | null) => void;
  setMobilePortalTarget: (node: HTMLDivElement | null) => void;
};

const AdminEditorPanelContext =
  createContext<AdminEditorPanelContextValue | null>(null);

export function useAdminEditorPanel() {
  const context = useContext(AdminEditorPanelContext);
  if (!context) {
    throw new Error(
      "useAdminEditorPanel must be used within AdminEditorPanelProvider.",
    );
  }
  return context;
}

export function AdminEditorPanelProvider({
  children,
  defaultOpen = false,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(defaultOpen);
  const [desktopPortalTarget, setDesktopPortalTarget] =
    useState<HTMLDivElement | null>(null);
  const [mobilePortalTarget, setMobilePortalTarget] =
    useState<HTMLDivElement | null>(null);

  const toggleOpen = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const portalTarget = isMobile ? mobilePortalTarget : desktopPortalTarget;

  const value = useMemo<AdminEditorPanelContextValue>(
    () => ({
      open,
      setOpen,
      toggleOpen,
      portalTarget,
      setDesktopPortalTarget,
      setMobilePortalTarget,
    }),
    [open, toggleOpen, portalTarget],
  );

  return (
    <AdminEditorPanelContext.Provider value={value}>
      {children}
    </AdminEditorPanelContext.Provider>
  );
}

export function AdminEditorPanelLayout({
  children,
  className,
  variant = "inset",
}: {
  children: ReactNode;
  className?: string;
  variant?: "inset" | "flush";
}) {
  const { open, setDesktopPortalTarget, setMobilePortalTarget } =
    useAdminEditorPanel();
  const panelWidthClassName =
    variant === "flush" ? "w-80" : "w-(--sidebar-width)";
  const desktopPaddingClassName = variant === "flush" ? "p-0" : "p-2";
  const panelSurfaceClassName =
    variant === "flush"
      ? "h-full min-h-0 overflow-y-auto overscroll-contain rounded-none border-0 border-l border-slate-200 bg-white text-slate-800 shadow-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      : "h-full min-h-0 overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

  return (
    <div
      className={cn(
        "relative flex min-h-0 w-full max-w-full flex-1 overflow-x-hidden",
        className,
      )}
    >
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>

      <div
        className={cn(
          "hidden shrink-0 overflow-hidden transition-[width] duration-200 ease-linear lg:block",
          open ? panelWidthClassName : "w-0",
        )}
      >
        <aside
          className={cn(
            "h-full transition-opacity duration-150",
            desktopPaddingClassName,
            open ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          aria-hidden={!open}
        >
          <div
            ref={setDesktopPortalTarget}
            className={panelSurfaceClassName}
          />
        </aside>
      </div>

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-40 w-full transition-transform duration-200 lg:hidden",
          variant === "flush" ? "max-w-80 p-0" : "max-w-(--sidebar-width) p-2",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        <div
          ref={setMobilePortalTarget}
          className={panelSurfaceClassName}
        />
      </div>
    </div>
  );
}

export function AdminEditorPanelToggleButton({
  className,
}: {
  className?: string;
}) {
  const { open, setOpen } = useAdminEditorPanel();

  return (
    <Button
      type="button"
      variant={open ? "default" : "outline"}
      size="sm"
      className={cn("rounded-full", className)}
      onClick={() => setOpen(!open)}
    >
      <SlidersHorizontal className="h-4 w-4" />
      {open ? "Cerrar panel de edición" : "Abrir panel de edición"}
    </Button>
  );
}
