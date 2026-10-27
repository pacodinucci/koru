"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";

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
      <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
        {trigger ? (
          <ResponsiveDialogTrigger render={<button type="button" />}>
            {trigger}
          </ResponsiveDialogTrigger>
        ) : null}
        <ResponsiveDialogContent
          className="inset-x-auto top-0 left-0 h-[100dvh] max-h-[100dvh] w-full rounded-none border-0 duration-300 md:top-1/2 md:left-1/2 md:h-auto md:max-h-[90dvh] md:w-[min(calc(100vw-2rem),70rem)] md:rounded-2xl md:border [font-family:var(--font-montserrat)]"
          overlayClassName="duration-300"
        >
          <ResponsiveDialogHeader className="border-slate-200 px-6 py-5 pr-14">
            <ResponsiveDialogTitle className="text-xl font-semibold">{title}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>{description}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          {children}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}

