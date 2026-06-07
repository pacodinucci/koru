"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function ResponsiveDialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="responsive-dialog" {...props} />;
}

function ResponsiveDialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="responsive-dialog-trigger" {...props} />;
}

function ResponsiveDialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="responsive-dialog-close" {...props} />;
}

function ResponsiveDialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="responsive-dialog-portal" {...props} />;
}

function ResponsiveDialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="responsive-dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function ResponsiveDialogContent({
  className,
  children,
  showCloseButton = true,
  overlayClassName,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  overlayClassName?: string;
}) {
  return (
    <ResponsiveDialogPortal>
      <ResponsiveDialogOverlay className={overlayClassName} />
      <DialogPrimitive.Popup
        data-slot="responsive-dialog-content"
        className={cn(
          "fixed z-50 flex max-h-[calc(100svh-2rem)] flex-col overflow-hidden bg-background bg-clip-padding text-sm shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0",
          "inset-x-0 bottom-0 rounded-t-xl border-t data-ending-style:translate-y-10 data-starting-style:translate-y-10",
          "md:top-1/2 md:left-1/2 md:bottom-auto md:w-[min(calc(100vw-2rem),56rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:border md:data-ending-style:translate-y-[calc(-50%+1rem)] md:data-starting-style:translate-y-[calc(-50%+1rem)]",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot="responsive-dialog-close"
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-3 right-3"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Cerrar</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Popup>
    </ResponsiveDialogPortal>
  );
}

function ResponsiveDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="responsive-dialog-header"
      className={cn("shrink-0 border-b border-transparent p-4 pr-12", className)}
      {...props}
    />
  );
}

function ResponsiveDialogBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="responsive-dialog-body"
      className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-4", className)}
      {...props}
    />
  );
}

function ResponsiveDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="responsive-dialog-footer"
      className={cn("shrink-0 flex flex-col-reverse gap-2 border-t bg-background p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

function ResponsiveDialogTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="responsive-dialog-title"
      className={cn("font-heading text-base font-medium text-foreground", className)}
      {...props}
    />
  );
}

function ResponsiveDialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="responsive-dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
};
