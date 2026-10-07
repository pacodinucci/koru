"use client";

import { Plus, Settings2 } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogHeader, ResponsiveDialogTitle } from "@/components/ui/responsive-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { initialUserInvitationActionState } from "@/modules/users/lib/user-invitation-feedback";
import { inviteFamilyUserAction } from "@/modules/families/server/families.actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" className="w-full" disabled={pending}>{pending ? "Enviando..." : "Enviar invitación"}</Button>;
}

export function FamilyAdminActionsMenu({ familyId, familyName }: { familyId: string; familyName: string }) {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [state, formAction] = useActionState(inviteFamilyUserAction, initialUserInvitationActionState);
  const trigger = <Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label="Opciones de familia"><Settings2 /></Button>;
  const openInvitation = () => {
    setMenuOpen(false);
    setDialogOpen(true);
  };

  return <>
    {isMobile ? (
      <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>Opciones de familia</DrawerTitle></DrawerHeader>
          <div className="p-4 pt-0">
            <Button type="button" variant="outline" className="w-full justify-start whitespace-nowrap" onClick={openInvitation}><Plus /> Agregar usuario</Button>
          </div>
        </DrawerContent>
      </Drawer>
    ) : (
      <DropdownMenu>
        <DropdownMenuTrigger render={trigger} />
        <DropdownMenuContent align="end" className="w-max">
          <DropdownMenuItem className="whitespace-nowrap" onClick={openInvitation}><Plus /> Agregar usuario</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )}
    <ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <ResponsiveDialogContent className="font-montserrat md:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Invitar usuario</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Enviá una invitación para que se sume a la familia {familyName}.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <form action={formAction} className="grid gap-4">
            <input type="hidden" name="familyId" value={familyId} />
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email
              <Input name="email" type="email" required autoComplete="email" placeholder="persona@ejemplo.com" autoFocus />
            </label>
            {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-600" : state.status === "warning" ? "text-amber-700" : "text-emerald-700"}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null}
            <SubmitButton />
          </form>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  </>;
}
