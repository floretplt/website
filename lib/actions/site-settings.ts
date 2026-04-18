"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateSiteSettings(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: row } = await admin.from("site_settings").select("id").limit(1).maybeSingle();

  const announcement_uk = String(formData.get("announcement_uk") ?? "") || null;
  const announcement_en = String(formData.get("announcement_en") ?? "") || null;
  const hero_image_url = String(formData.get("hero_image_url") ?? "") || null;
  const about_short_uk = String(formData.get("about_short_uk") ?? "") || null;
  const about_short_en = String(formData.get("about_short_en") ?? "") || null;
  const phone = String(formData.get("phone") ?? "");
  const email = String(formData.get("email") ?? "") || null;
  const pickup_address_uk = String(formData.get("pickup_address_uk") ?? "");
  const pickup_address_en = String(formData.get("pickup_address_en") ?? "");
  const same_day_cutoff_time = String(formData.get("same_day_cutoff_time") ?? "18:10");
  const same_day_delivery_end_time = String(
    formData.get("same_day_delivery_end_time") ?? "19:00",
  );

  const payload = {
    announcement_uk,
    announcement_en,
    hero_image_url,
    about_short_uk,
    about_short_en,
    phone,
    email,
    pickup_address_uk,
    pickup_address_en,
    same_day_cutoff_time,
    same_day_delivery_end_time,
    updated_at: new Date().toISOString(),
  };

  const { error } = row
    ? await admin.from("site_settings").update(payload).eq("id", row.id)
    : await admin.from("site_settings").insert(payload);

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin/settings");
}
