export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-full [font-family:var(--font-montserrat)]">
      {children}
    </div>
  );
}
