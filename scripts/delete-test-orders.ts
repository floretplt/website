/**
 * Remove all rows from public.orders (test / QA cleanup).
 * Usage: npx tsx scripts/delete-test-orders.ts
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
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

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: orders, error: listErr } = await admin
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, created_at")
    .order("order_number", { ascending: true });

  if (listErr) {
    console.error("Failed to list orders:", listErr.message);
    process.exit(1);
  }

  const rows = orders ?? [];
  if (rows.length === 0) {
    console.log("No orders in database — admin panel is already empty.");
    return;
  }

  console.log(`Found ${rows.length} order(s):`);
  for (const o of rows) {
    console.log(
      `  #${o.order_number}  ${o.customer_name}  ${o.customer_phone}  ${o.created_at}`,
    );
  }

  const { error: delErr, count } = await admin
    .from("orders")
    .delete({ count: "exact" })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (delErr) {
    console.error("Delete failed:", delErr.message);
    process.exit(1);
  }

  console.log(`Deleted ${count ?? rows.length} order(s).`);
  console.log(
    "Tip: in Supabase SQL Editor run select setval('orders_order_number_seq', 1, false); to restart order numbers at #1.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
