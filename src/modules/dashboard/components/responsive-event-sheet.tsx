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

type Props = {
  title: string;
  description: string;
  trigger?: ReactNode;
  children: ReactNode;
  openOnMount?: boolean;
  closeHref?: string;
};

export function ResponsiveEventSheet({
  title,
  description,
  trigger,
  children,
  openOnMount = false,
  closeHref,
}: Props) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [open, setOpen] = useState(openOnMount);

  useEffect(() => {
    setOpen(openOnMount);
  }, [openOnMount]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next && closeHref) {
      router.push(closeHref);
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
        <SheetContent side={isMobile ? "bottom" : "right"} className="w-full sm:max-w-md [font-family:var(--font-montserrat)]">
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
