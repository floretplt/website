import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { OrderDetailForm } from "@/components/admin/OrderDetailForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/orders"
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          ← До списку замовлень
        </Link>
        <PageHeader
          title="Деталі замовлення"
          description={`Створено ${new Date(
            (order as { created_at: string }).created_at,
          ).toLocaleString("uk-UA")}`}
        />
      </div>
      <OrderDetailForm order={order as never} />
    </div>
  );
}
