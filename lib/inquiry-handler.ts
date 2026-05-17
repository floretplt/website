import { NextResponse } from "next/server";
import { decorInquirySchema } from "@/lib/validators";
import { escapeHtml } from "@/lib/html-escape";
import { normalizeUaPhone } from "@/lib/phone";
import { getClientIp, rateLimitAsync } from "@/lib/rate-limit";
import { sendTelegramMessage } from "@/lib/telegram";

const CONTACT_UK: Record<"viber" | "telegram" | "call", string> = {
  viber: "Viber",
  telegram: "Telegram",
  call: "Подзвонити",
};

export type InquiryKind = "decor" | "wedding";

const TITLE_UK: Record<InquiryKind, string> = {
  decor: "Заявка: декор / заклад / івент",
  wedding: "Заявка: весілля",
};

/**
 * Shared POST handler for the contact-form-style inquiries
 * (`/api/decor-inquiry`, `/api/wedding-inquiry`). Validates with the same
 * Zod schema and sends a Telegram message; only the heading differs.
 */
export async function handleInquiry(
  req: Request,
  kind: InquiryKind,
): Promise<Response> {
  const ip = getClientIp(req.headers);
  if (!(await rateLimitAsync(ip))) {
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
    `<b>${TITLE_UK[kind]}</b>`,
    "",
    `<b>Запит:</b>\n${escapeHtml(data.request)}`,
    `<b>Ім'я:</b> ${escapeHtml(data.customer_name)}`,
    `<b>Телефон:</b> <code>${escapeHtml(phone)}</code>`,
    `<b>Зв'язок:</b> ${CONTACT_UK[data.contact_preference]}`,
  ].join("\n");

  await sendTelegramMessage(text);

  return NextResponse.json({ ok: true });
}
