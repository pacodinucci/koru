"use client";

import { useState } from "react";

import { FamiliesDataTable, type FamilyListItem } from "@/modules/families/components/families-data-table";
import { ManageFamilyDialog } from "@/modules/families/components/manage-family-dialog";

type ManagementFamily = FamilyListItem & { planId: string | null };
type FamilyManagementProps = {
  families: ManagementFamily[];
  options: {
    users: Array<{ id: string; name: string | null; email: string; familyId: string | null }>;
    students: Array<{ id: string; firstName: string; lastName: string; familyId: string | null }>;
    plans: Array<{ id: string; name: string; isActive: boolean }>;
  };
  canWaive: boolean;
  initialSearch?: string;
};

export function FamiliesManagement({ families, options, canWaive, initialSearch = "" }: FamilyManagementProps) {
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const selectedFamily = families.find((family) => family.id === selectedFamilyId) ?? null;

  return <>
    <FamiliesDataTable families={families} onManage={setSelectedFamilyId} initialSearch={initialSearch} />
    <ManageFamilyDialog familyId={selectedFamily?.id ?? null} familyName={selectedFamily?.name ?? null} familyPlanId={selectedFamily?.planId ?? null} familyStatus={selectedFamily?.status ?? null} options={options} canWaive={canWaive} open={selectedFamily !== null} onOpenChange={(open) => { if (!open) setSelectedFamilyId(null); }} />
  </>;
}