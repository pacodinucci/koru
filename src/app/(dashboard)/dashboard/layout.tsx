import { requireDashboardUser } from "@/modules/auth/server/auth-guards";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireDashboardUser();
  return (
    <div className="min-h-full [font-family:var(--font-montserrat)]">
      {children}
    </div>
  );
}
