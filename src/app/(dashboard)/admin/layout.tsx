export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="admin-font-fira min-h-full">{children}</div>;
}
