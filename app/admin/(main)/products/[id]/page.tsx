import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { ProductForm } from "@/components/admin/ProductForm";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import type { ProductRow } from "@/lib/types/database";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!product) {
    notFound();
  }

  const row = product as ProductRow;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          ← До товарів
        </Link>
        <PageHeader title="Редагування" description={row.name_uk} />
      </div>
      <ProductForm product={row} />
    </div>
  );
}
