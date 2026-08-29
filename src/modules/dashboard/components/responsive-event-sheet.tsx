"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const PANEL_TRANSITION_MS = 300;

type Props = {
  title: string;
  description: string;
  trigger?: ReactNode;
  children: ReactNode;
  openOnMount?: boolean;
  closeHref?: string;
  onClose?: () => void;
};

export function ResponsiveEventSheet({
  title,
  description,
  trigger,
  children,
  openOnMount = false,
  closeHref,
  onClose,
}: Props) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [open, setOpen] = useState(openOnMount);

  useEffect(() => {
    setOpen(openOnMount);
  }, [openOnMount]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      if (closeHref) router.push(closeHref);
      window.setTimeout(() => onClose?.(), PANEL_TRANSITION_MS);
    }
  };

  return (
    <>
      {trigger ? (
        <button type="button" onClick={() => setOpen(true)}>
          {trigger}
        </button>
      ) : null}

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side={isMobile ? "bottom" : "right"} className="w-full duration-300 sm:max-w-md [font-family:var(--font-montserrat)]" overlayClassName="duration-300">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <div className="p-4">{children}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}

