import { DashboardRubricsView } from "@/modules/families/views/dashboard-rubrics-view";

// Keep legacy callers on the rubric experience until their routes redirect.
export async function DashboardPlansView({ canManage }: { canManage: boolean }) {
  return DashboardRubricsView({ canManage });
}
