export default function FamilyDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen [font-family:var(--font-montserrat)]">
      {children}
    </div>
  );
}
