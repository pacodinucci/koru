import { requireAdmin } from "@/modules/auth/server/auth-guards";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();
  return (
    <div className="min-h-full [font-family:var(--font-montserrat)]">
      {children}
    </div>
  );
}
