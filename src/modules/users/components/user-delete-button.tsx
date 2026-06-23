"use client";

import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { deleteUserAction } from "@/modules/users/server/user-invitations.actions";

type UserDeleteButtonProps = {
  userId: string;
  userEmail: string;
  disabled?: boolean;
};

export function UserDeleteButton({
  userId,
  userEmail,
  disabled = false,
}: UserDeleteButtonProps) {
  if (disabled) {
    return (
      <Button
        type="button"
        variant="destructive"
        size="icon-sm"
        disabled
        aria-label="No podes eliminar tu propio usuario"
        title="No podes eliminar tu propio usuario"
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger
        render={
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            aria-label={`Eliminar usuario ${userEmail}`}
          />
        }
      >
        <Trash2Icon className="h-4 w-4" />
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="md:w-[min(calc(100vw-2rem),28rem)] [font-family:var(--font-montserrat)] [&_*]:[font-family:var(--font-montserrat)]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Eliminar usuario</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Esta accion no se puede deshacer.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="space-y-3">
          <p className="text-sm text-slate-700">
            Vas a eliminar el usuario{" "}
            <span className="font-semibold text-slate-950">{userEmail}</span>.
          </p>
          <p className="text-sm text-slate-600">
            Se cerraran sus sesiones y se eliminaran sus accesos asociados.
          </p>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose
            render={
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            }
          />
          <form action={deleteUserAction}>
            <input type="hidden" name="userId" value={userId} />
            <Button type="submit" variant="destructive">
              Eliminar definitivamente
            </Button>
          </form>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
