/**
 * Remove all catalog products in bouquets + box-bouquets categories.
 * Usage: npx tsx scripts/delete-catalog-bouquets.ts
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const BOUQUET_CATEGORIES = ["bouquets", "box-bouquets"] as const;

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: products, error: listErr } = await admin
    .from("products")
    .select("id, slug, name_uk, category")
    .in("category", [...BOUQUET_CATEGORIES])
    .order("category")
    .order("slug");

  if (listErr) {
    console.error("Failed to list products:", listErr.message);
    process.exit(1);
  }

  const rows = products ?? [];
  if (rows.length === 0) {
    console.log("No bouquet products in catalog — already empty.");
    return;
  }

  console.log(`Found ${rows.length} product(s):`);
  for (const p of rows) {
    console.log(`  [${p.category}] ${p.slug} — ${p.name_uk}`);
  }

  const { error: delErr, count } = await admin
    .from("products")
    .delete({ count: "exact" })
    .in("category", [...BOUQUET_CATEGORIES]);

  if (delErr) {
    console.error("Delete failed:", delErr.message);
    process.exit(1);
  }

  console.log(`Deleted ${count ?? rows.length} product(s) from bouquets + box-bouquets.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
