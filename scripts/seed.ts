import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function eurFromUah(uah: number) {
  return Math.max(0.01, Math.round((uah / 41) * 100) / 100);
}

/** S/M/L tiers from a single reference price (treated as medium). */
function priceTiers(anchorUah: number) {
  const s = Math.max(50, Math.round((anchorUah * 0.88) / 50) * 50);
  const m = anchorUah;
  const l = Math.round((anchorUah * 1.22) / 50) * 50;
  return {
    price_uah_small: s,
    price_uah_medium: m,
    price_uah_large: l,
    price_eur_small: eurFromUah(s),
    price_eur_medium: eurFromUah(m),
    price_eur_large: eurFromUah(l),
  };
}

async function main() {
  const { data: existing } = await admin.from("site_settings").select("id").limit(1);
  if (!existing?.length) {
    await admin.from("site_settings").insert({
      phone: "066 278 9828",
      email: null,
      pickup_address_uk:
        "вул. Соборності, 25 Б, м. Полтава, Полтавська область, 36010",
      pickup_address_en:
        "25 B Sobornosti Street, Poltava, Poltava Oblast, 36010, Ukraine",
      announcement_uk: "Доставка по Полтаві — уточнюйте час у месенджері.",
      announcement_en: "Delivery in Poltava — message us for timing.",
      about_short_uk:
        "FLORET був створений у 2015 році в самому серці Полтави.\n\nЗ того часу ми створюємо букети для особливих моментів - з увагою до деталей і неповторним стилем.\n\nМи про красу, витонченість та небанальний підхід. Саме тому нам довіряють.\n\nХто і кому дарує наші букети?\n\nНаші букети обирають люди з вільним мисленням, витончені, відкриті до нового, життєрадісні та доброзичливі - ті, хто цінує все красиве й незвичне. Наші клієнти не бояться давати зворотний зв'язок і говорити про недоліки, вони демократичні та йдуть у ногу з часом.\nНам дуже пощастило, що у 99% випадків наші букети потрапляють до рук однодумців. Тому майстерня FLORET - це не лише про квіти, а й про дружбу.",
      about_short_en:
        "FLORET was founded in 2015 in the heart of Poltava.\n\nSince then, we’ve been making bouquets for special moments — with attention to detail and a distinctive style.\n\nWe’re about beauty, refinement, and an approach that isn’t ordinary. That’s why people trust us.\n\nWho gives — and receives — our bouquets?\n\nThey’re chosen by open-minded, refined people who love what’s beautiful and unusual. Our clients aren’t afraid to give feedback.\n\nWe’re lucky that in most cases our bouquets reach kindred spirits. So the FLORET workshop is about flowers — and about friendship.",
      same_day_cutoff_time: "18:10:00",
      same_day_delivery_end_time: "19:00:00",
      closed_weekdays: [],
      working_hours: {
        mon_fri: "08:30–19:00",
        sat: "08:30–19:00",
        sun: "09:00–19:00",
      },
    });
    console.log("Inserted site_settings");
  }

  const products = [
    {
      slug: "vesnianyi-malyi",
      name_uk: "Весняний букет — маленький",
      name_en: "Spring bouquet — small",
      description_uk: "Ніжний мікс сезонних квітів.",
      description_en: "Soft mix of seasonal blooms.",
      category: "bouquets",
      size: "small",
      color_mood: "pink",
      ...priceTiers(1200),
      is_available: true,
      is_featured: true,
      sort_order: 10,
    },
    {
      slug: "miskyi-serednii",
      name_uk: "Міський букет — середній",
      name_en: "City bouquet — medium",
      description_uk: "Стримана палітра для подарунка.",
      description_en: "Restrained palette for gifting.",
      category: "bouquets",
      size: "medium",
      color_mood: "pink",
      ...priceTiers(1800),
      is_available: true,
      is_featured: true,
      sort_order: 20,
    },
    {
      slug: "sadovyi-velykyi",
      name_uk: "Садовий букет — великий",
      name_en: "Garden bouquet — large",
      description_uk: "Об'ємна композиція з зеленню.",
      description_en: "Full arrangement with greenery.",
      category: "bouquets",
      size: "large",
      color_mood: "bright",
      ...priceTiers(2600),
      is_available: true,
      is_featured: false,
      sort_order: 30,
    },
    {
      slug: "korobka-blush",
      name_uk: "Букет у коробці — Blush",
      name_en: "Box bouquet — Blush",
      description_uk: "Пастельні тони в квадратній коробці.",
      description_en: "Pastel tones in a square box.",
      category: "box-bouquets",
      size: "medium",
      color_mood: "pink",
      ...priceTiers(2200),
      is_available: true,
      is_featured: true,
      sort_order: 10,
    },
    {
      slug: "korobka-moon",
      name_uk: "Букет у коробці — Moon",
      name_en: "Box bouquet — Moon",
      description_uk: "Холодна палітра, біло-блакитна.",
      description_en: "Cool white and blue palette.",
      category: "box-bouquets",
      size: "small",
      color_mood: "blue",
      ...priceTiers(1900),
      is_available: true,
      is_featured: false,
      sort_order: 20,
    },
    {
      slug: "korobka-sun",
      name_uk: "Букет у коробці — Sun",
      name_en: "Box bouquet — Sun",
      description_uk: "Яскраві акценти для свята.",
      description_en: "Bright accents for celebration.",
      category: "box-bouquets",
      size: "large",
      color_mood: "bright",
      ...priceTiers(2800),
      is_available: true,
      is_featured: true,
      sort_order: 30,
    },
    {
      slug: "ranok-malyi",
      name_uk: "Ранковий букет — маленький",
      name_en: "Morning bouquet — small",
      description_uk: "Легкий настрій для зустрічі.",
      description_en: "Light mood for a meeting.",
      category: "bouquets",
      size: "small",
      color_mood: "white",
      ...priceTiers(1100),
      is_available: true,
      is_featured: false,
      sort_order: 5,
    },
    {
      slug: "korobka-forest",
      name_uk: "Букет у коробці — Forest",
      name_en: "Box bouquet — Forest",
      description_uk: "Глибокі зелені тони.",
      description_en: "Deep green tones.",
      category: "box-bouquets",
      size: "medium",
      color_mood: "yellow",
      ...priceTiers(2100),
      is_available: true,
      is_featured: false,
      sort_order: 40,
    },
    {
      slug: "bouquet-dusk",
      name_uk: "Букет — Сутінки",
      name_en: "Bouquet — Dusk",
      description_uk: "Теплі осінні відтінки.",
      description_en: "Warm autumn hues.",
      category: "bouquets",
      size: "medium",
      color_mood: "bright",
      ...priceTiers(2000),
      is_available: false,
      is_featured: false,
      sort_order: 40,
    },
  ];

  for (const p of products) {
    const row = {
      ...p,
      images: [],
      image_url: null,
    };
    const { error } = await admin.from("products").upsert(row, {
      onConflict: "category,slug",
    });
    if (error) {
      console.error("Product upsert error", p.slug, error);
    } else {
      console.log("OK", p.slug);
    }
  }
}

main().catch(console.error);
