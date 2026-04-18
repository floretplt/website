import Image from "next/image";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { primaryImage } from "@/lib/product-display";
import type { ProductRow } from "@/lib/types/database";
import { ADMIN_CATEGORY_LABEL } from "@/lib/admin/category-labels";
import { PRODUCT_CATEGORIES, type ProductCategory } from "@/lib/constants";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { ProductToggle } from "@/components/admin/ProductToggle";
import {
  Card,
  EmptyState,
  PageHeader,
} from "@/components/admin/ui";
import { IconEdit, IconImage, IconPlus } from "@/components/admin/icons";
import { cn } from "@/lib/utils";

function categoryFromSearchParam(
  raw: string | string[] | undefined,
): ProductCategory | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v || v === "all") return null;
  return (PRODUCT_CATEGORIES as readonly string[]).includes(v)
    ? (v as ProductCategory)
    : null;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { category?: string | string[] };
}) {
  await requireAdmin();
  const selectedCategory = categoryFromSearchParam(searchParams.category);

  const admin = createAdminClient();
  let query = admin
    .from("products")
    .select(
      "id, slug, name_uk, category, is_available, is_featured, sort_order, price_uah_small, price_uah_medium, price_uah_large, image_url, images",
    );
  if (selectedCategory) {
    query = query.eq("category", selectedCategory);
  }
  const { data: products } = await query
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  const rows = products ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Товари"
        description={`Усього: ${rows.length}`}
        actions={
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <IconPlus size={14} />
            Додати товар
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
        <Link
          href="/admin/products"
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            selectedCategory === null
              ? "bg-zinc-900 text-white shadow-sm"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
          )}
        >
          Усі
        </Link>
        {PRODUCT_CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/admin/products?category=${c}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              selectedCategory === c
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
            )}
          >
            {ADMIN_CATEGORY_LABEL[c]}
          </Link>
        ))}
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            icon={<IconImage size={18} />}
            title={
              selectedCategory
                ? "У цій категорії поки немає товарів"
                : "Каталог поки порожній"
            }
            description="Додайте перший товар, щоб він з'явився на сайті."
            action={
              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                <IconPlus size={14} />
                Додати товар
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/60 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="w-16 px-6 py-3">Фото</th>
                  <th className="px-6 py-3">Назва</th>
                  <th className="px-6 py-3">Категорія</th>
                  <th className="px-6 py-3">Ціни (S / M / L), ₴</th>
                  <th className="px-6 py-3">В наявності</th>
                  <th className="px-6 py-3">На головній</th>
                  <th className="w-32 px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const row = p as ProductRow;
                  const thumb = primaryImage(row);
                  const catLabel =
                    ADMIN_CATEGORY_LABEL[row.category as ProductCategory] ??
                    row.category;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60"
                    >
                      <td className="px-6 py-3">
                        {thumb ? (
                          <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                            <Image
                              src={thumb}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-zinc-200 text-zinc-400">
                            <IconImage size={16} />
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 font-medium text-zinc-900">
                        {p.name_uk}
                      </td>
                      <td className="px-6 py-3 text-zinc-600">{catLabel}</td>
                      <td className="px-6 py-3 whitespace-nowrap font-mono text-xs text-zinc-700">
                        {row.price_uah_small ?? "—"} / {row.price_uah_medium ?? "—"}{" "}
                        / {row.price_uah_large ?? "—"}
                      </td>
                      <td className="px-6 py-3">
                        <ProductToggle
                          id={p.id}
                          which="available"
                          initial={Boolean(p.is_available)}
                        />
                      </td>
                      <td className="px-6 py-3">
                        <ProductToggle
                          id={p.id}
                          which="featured"
                          initial={Boolean(p.is_featured)}
                          productAvailable={Boolean(p.is_available)}
                        />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                          >
                            <IconEdit size={14} />
                            Редагувати
                          </Link>
                          <DeleteProductButton id={p.id} name={p.name_uk} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
