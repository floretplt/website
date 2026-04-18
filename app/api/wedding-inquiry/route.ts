import { NextResponse } from "next/server";
import { decorInquirySchema } from "@/lib/validators";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { sendTelegramMessage } from "@/lib/telegram";
import { normalizeUaPhone } from "@/lib/phone";

const CONTACT_UK: Record<"viber" | "telegram" | "call", string> = {
  viber: "Viber",
  telegram: "Telegram",
  call: "Подзвонити",
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = decorInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const phone = normalizeUaPhone(data.customer_phone);

  const text = [
    "<b>Заявка: весілля</b>",
    "",
    `<b>Запит:</b>\n${escapeHtml(data.request)}`,
    `<b>Ім'я:</b> ${escapeHtml(data.customer_name)}`,
    `<b>Телефон:</b> <code>${escapeHtml(phone)}</code>`,
    `<b>Зв'язок:</b> ${CONTACT_UK[data.contact_preference]}`,
  ].join("\n");

  await sendTelegramMessage(text);

  return NextResponse.json({ ok: true });
}
