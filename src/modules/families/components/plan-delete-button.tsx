"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { PlanDeleteDialog } from "@/modules/families/components/plan-delete-dialog";

export function PlanDeleteButton({ plan }: { plan: { id: string; name: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="destructive" size="icon-sm" aria-label={`Eliminar plan ${plan.name}`} title={`Eliminar plan ${plan.name}`} onClick={() => setOpen(true)}>
        <Trash2Icon />
      </Button>
      {open ? <PlanDeleteDialog plan={plan} onClose={() => setOpen(false)} onDeleted={() => {
        setOpen(false);
        toast("Plan eliminado.", "success");
        router.replace("/dashboard/families/plans");
      }} /> : null}
    </>
  );
}
