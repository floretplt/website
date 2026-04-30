import { format as formatDate } from "date-fns";
import { uk } from "date-fns/locale";
import type { SiteSettingsRow } from "@/lib/types/database";

export function formatMoney(amount: number, currency: "UAH" | "EUR") {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateLocale(date: Date | string, pattern: string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDate(d, pattern, { locale: uk });
}

/** Renders `site_settings.working_hours` jsonb for footer & contact (not raw JSON). */
export function formatWorkingHours(wh: SiteSettingsRow["working_hours"]): string {
  if (!wh || typeof wh !== "object") return "—";
  const o = wh as Record<string, unknown>;

  if (
    typeof o.mon_fri === "string" &&
    typeof o.sat === "string" &&
    typeof o.sun === "string"
  ) {
    return [
      `понеділок–п’ятниця: ${o.mon_fri}`,
      `субота: ${o.sat}`,
      `неділя: ${o.sun}`,
    ].join("\n");
  }

  const weekdays = o.weekdays;
  const sat = o.sat;
  const sun = o.sun;
  if (typeof weekdays === "string" && typeof sat === "string") {
    return [
      `будні: ${weekdays}`,
      `субота: ${sat}`,
      typeof sun === "string" ? `неділя: ${sun}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return JSON.stringify(wh);
}
