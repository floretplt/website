import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUaPhone } from "@/lib/phone";
import { z } from "zod";

const schema = z.object({
  order_number: z.coerce.number().int().positive(),
  phone: z.string().transform((s) => normalizeUaPhone(s)),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { order_number, phone } = parsed.data;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("orders")
      .select(
        "order_number, status, product_name, price_paid, currency, paid, created_at, delivery_type, delivery_date",
      )
      .eq("order_number", order_number)
      .eq("customer_phone", phone)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ order: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
