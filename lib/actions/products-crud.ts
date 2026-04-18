"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureUniqueProductSlug, slugifyFromUkrainian } from "@/lib/slug";
import { productFormSchema } from "@/lib/validators";

/** Rough EUR mirror for DB (shop shows UAH in Ukrainian). */
function eurMirrorFromUah(uah: number | null): number | null {
  if (uah == null) return null;
  return Math.max(0.01, Math.round((uah / 41) * 100) / 100);
}

export async function saveProduct(
  input: Record<string, unknown>,
  id?: string,
) {
  await requireAdmin();
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Некоректні дані товару");
  }
  const data = parsed.data;
  const admin = createAdminClient();

  const nameUk = data.name_uk.trim();
  const nameEn = data.name_en.trim() || nameUk;
  const descUk = data.description_uk?.trim() || null;
  const descEn = data.description_en?.trim() || descUk;

  let slug: string;
  let is_available = true;
  if (id) {
    const { data: existing, error: fetchErr } = await admin
      .from("products")
      .select("slug, is_available")
      .eq("id", id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!existing?.slug) throw new Error("Товар не знайдено");
    slug = existing.slug;
    is_available = Boolean(existing.is_available);
  } else {
    const base = slugifyFromUkrainian(nameUk);
    slug = await ensureUniqueProductSlug(admin, base);
  }

  const row = {
    slug,
    name_uk: nameUk,
    name_en: nameEn,
    description_uk: descUk,
    description_en: descEn,
    category: data.category,
    /** Technical default; customers pick S/M/L when ordering. */
    size: "medium" as const,
    color_mood: data.color_mood,
    price_uah_small: data.price_uah_small,
    price_uah_medium: data.price_uah_medium,
    price_uah_large: data.price_uah_large,
    price_eur_small: eurMirrorFromUah(data.price_uah_small),
    price_eur_medium: eurMirrorFromUah(data.price_uah_medium),
    price_eur_large: eurMirrorFromUah(data.price_uah_large),
    images: data.images ?? [],
    image_url: data.image_url,
    is_available,
    /** Not in stock → never featured */
    is_featured: is_available ? data.is_featured : false,
    sort_order: data.sort_order,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await admin.from("products").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from("products").insert(row);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  revalidatePath("/");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  revalidatePath("/");
}
