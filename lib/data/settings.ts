import { createClient } from "@/lib/supabase/server";
import { parseDeliveryPricingConfig } from "@/lib/delivery-pricing";
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
  email: null,
  announcement_uk: null,
  announcement_en: null,
  hero_image_url: null,
  about_short_uk:
    "FLORET був створений у 2015 році в самому серці Полтави.\n\nЗ того часу ми створюємо букети для особливих моментів - з увагою до деталей і неповторним стилем.\n\nМи про красу, витонченість та небанальний підхід. Саме тому нам довіряють.\n\nХто і кому дарує наші букети?\n\nНаші букети обирають люди з вільним мисленням, витончені, відкриті до нового, життєрадісні та доброзичливі - ті, хто цінує все красиве й незвичне. Наші клієнти не бояться давати зворотний зв'язок і говорити про недоліки, вони демократичні та йдуть у ногу з часом.\nНам дуже пощастило, що у 99% випадків наші букети потрапляють до рук однодумців. Тому майстерня FLORET - це не лише про квіти, а й про дружбу.",
  about_short_en:
    "FLORET was founded in 2015 in the heart of Poltava.\n\nSince then, we’ve been making bouquets for special moments — with attention to detail and a distinctive style.\n\nWe’re about beauty, refinement, and an approach that isn’t ordinary. That’s why people trust us.\n\nWho gives — and receives — our bouquets?\n\nThey’re chosen by open-minded, refined people who love what’s beautiful and unusual. Our clients aren’t afraid to give feedback.\n\nWe’re lucky that in most cases our bouquets reach kindred spirits. So the FLORET workshop is about flowers — and about friendship.",
  delivery_pricing: { bands: [], districts: [], zones: [] },
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
    const emailTrim =
      typeof row.email === "string" && row.email.trim() !== ""
        ? row.email.trim()
        : null;
    return {
      ...defaults,
      ...row,
      email: emailTrim ?? defaults.email,
      same_day_delivery_end_time:
        row.same_day_delivery_end_time ?? defaults.same_day_delivery_end_time,
      delivery_pricing:
        row.delivery_pricing != null
          ? parseDeliveryPricingConfig(row.delivery_pricing)
          : defaults.delivery_pricing,
    };
  } catch {
    return defaults;
  }
});

export function announcementForLocale(row: SiteSettingsRow): string | null {
  return row.announcement_uk;
}

export function aboutShortForLocale(row: SiteSettingsRow): string | null {
  return row.about_short_uk;
}
