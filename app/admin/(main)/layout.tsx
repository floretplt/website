import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { signOutAdmin } from "@/lib/actions/auth";

export default async function AdminMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <AdminShell signOutAction={signOutAdmin}>{children}</AdminShell>;
}
