"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DeliveryType, OrderStatus } from "@/lib/constants";
import { assertOrderStatusAllowedForDelivery } from "@/lib/order-status-policy";

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: row, error: fetchErr } = await admin
    .from("orders")
    .select("delivery_type")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr || !row) throw new Error(fetchErr?.message ?? "Замовлення не знайдено");
  assertOrderStatusAllowedForDelivery(
    row.delivery_type as DeliveryType,
    status,
  );
  const { error } = await admin
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function updateOrderPaid(id: string, paid: boolean) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ paid, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

export async function updateOrderNotes(id: string, admin_notes: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ admin_notes, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/orders/${id}`);
}

export async function toggleProductAvailability(id: string, is_available: boolean) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("products")
    .update({
      is_available,
      ...(is_available ? {} : { is_featured: false }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  revalidatePath("/");
}

export async function toggleProductFeatured(id: string, is_featured: boolean) {
  await requireAdmin();
  const admin = createAdminClient();
  if (is_featured) {
    const { data: row } = await admin
      .from("products")
      .select("is_available")
      .eq("id", id)
      .maybeSingle();
    if (!row?.is_available) {
      throw new Error("Спочатку увімкніть «В наявності»");
    }
  }
  const { error } = await admin
    .from("products")
    .update({ is_featured, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function updateProductSortOrder(id: string, sort_order: number) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("products")
    .update({ sort_order, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
}

export async function toggleProductFromForm(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const which = String(formData.get("which"));
  const current = formData.get("current") === "true";
  const admin = createAdminClient();
  if (which === "available") {
    const next = !current;
    await admin
      .from("products")
      .update({
        is_available: next,
        ...(next ? {} : { is_featured: false }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
  } else if (which === "featured") {
    const next = !current;
    if (next) {
      const { data: row } = await admin
        .from("products")
        .select("is_available")
        .eq("id", id)
        .maybeSingle();
      if (!row?.is_available) return;
    }
    await admin
      .from("products")
      .update({ is_featured: next, updated_at: new Date().toISOString() })
      .eq("id", id);
  }
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  revalidatePath("/");
}
