import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/routing";
import type { SiteSettingsRow } from "@/lib/types/database";
import { cache } from "react";

const defaults: SiteSettingsRow = {
  id: "00000000-0000-0000-0000-000000000001",
  working_hours: {
    mon_fri: "08:30–19:00",
    sat: "08:30–19:00",
    sun: "09:00–19:00",
  },
  same_day_cutoff_time: "18:10:00",
  same_day_delivery_end_time: "19:00:00",
  closed_weekdays: [],
  pickup_address_uk:
    "вул. Соборності, 25 Б, м. Полтава, Полтавська область, 36010",
  pickup_address_en:
    "25 B Sobornosti Street, Poltava, Poltava Oblast, 36010, Ukraine",
  phone: "066 278 9828",
  email: "hello@floret.poltava",
  announcement_uk: null,
  announcement_en: null,
  hero_image_url: null,
  about_short_uk:
    "Floret був створений у 2016 році в самому серці Полтави.\n\nЗ того часу ми створюємо букети для особливих моментів — з увагою до деталей і відчуттям стилю.\n\nМи про красу, витонченість та небанальний підхід. Саме тому нас обирають.",
  about_short_en:
    "Floret was founded in 2016 in the heart of Poltava.\n\nSince then, we’ve been making bouquets for special moments — with attention to detail and a sense of style.\n\nWe’re about beauty, refinement, and an approach that isn’t ordinary. That’s why people choose us.",
  delivery_pricing: { bands: [] },
  updated_at: new Date().toISOString(),
};

export const getSiteSettings = cache(async (): Promise<SiteSettingsRow> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error || !data) {
      return defaults;
    }
    const row = data as SiteSettingsRow;
    return {
      ...defaults,
      ...row,
      same_day_delivery_end_time:
        row.same_day_delivery_end_time ?? defaults.same_day_delivery_end_time,
      delivery_pricing:
        row.delivery_pricing != null
          ? (row.delivery_pricing as SiteSettingsRow["delivery_pricing"])
          : defaults.delivery_pricing,
    };
  } catch {
    return defaults;
  }
});

export function announcementForLocale(
  row: SiteSettingsRow,
  locale: Locale,
): string | null {
  return locale === "uk" ? row.announcement_uk : row.announcement_en;
}

export function aboutShortForLocale(
  row: SiteSettingsRow,
  locale: Locale,
): string | null {
  return locale === "uk" ? row.about_short_uk : row.about_short_en;
}
