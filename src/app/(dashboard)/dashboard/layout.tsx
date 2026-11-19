import { CurrentUserAvatarProvider } from "@/components/current-user-avatar";
import { requireDashboardUser } from "@/modules/auth/server/auth-guards";
import { ContactsStoreProvider } from "@/modules/contacts/views/contacts-store-provider";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireDashboardUser();
  return (
    <div className="min-h-full [font-family:var(--font-montserrat)]">
      <CurrentUserAvatarProvider image={user.image ?? null}>
        <ContactsStoreProvider key={user.id}>
          {children}
        </ContactsStoreProvider>
      </CurrentUserAvatarProvider>
    </div>
  );
}
