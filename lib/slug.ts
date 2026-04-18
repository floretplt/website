import type { SupabaseClient } from "@supabase/supabase-js";

/** Transliterate Ukrainian → latin and build URL-safe slug (a-z, 0-9, hyphen). */

const UA: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "h",
  ґ: "g",
  д: "d",
  е: "e",
  є: "ie",
  ж: "zh",
  з: "z",
  и: "y",
  і: "i",
  ї: "i",
  й: "i",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ь: "",
  ю: "iu",
  я: "ia",
  ы: "y",
  э: "e",
};

export function slugifyFromUkrainian(text: string): string {
  const t = text.trim().toLowerCase();
  if (!t) return "";
  let out = "";
  for (const ch of t) {
    if (UA[ch]) {
      out += UA[ch];
      continue;
    }
    if (/[a-z0-9]/.test(ch)) out += ch;
    else if (/[\s_\-/.,;:!?()[\]{}]+/.test(ch) || ch === "—" || ch === "–")
      out += "-";
  }
  return out
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

/** New product: pick a unique `slug` (adds -2, -3… if the base exists). */
export async function ensureUniqueProductSlug(
  admin: SupabaseClient,
  base: string,
): Promise<string> {
  const root =
    base && base.length > 0 ? base : `tovar-${Date.now().toString(36)}`;
  let n = 0;
  while (true) {
    const candidate = n === 0 ? root : `${root}-${n}`;
    const { data } = await admin
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    n += 1;
  }
}
