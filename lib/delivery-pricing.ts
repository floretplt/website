import type {
  DeliveryDistrictRow,
  DeliveryNamedZoneRow,
  DeliveryPricingBand,
  DeliveryPricingConfig,
} from "@/lib/types/database";

export type DeliveryTimeWindow = "morning" | "afternoon" | "evening";

const WINDOW_KEYS: Record<DeliveryTimeWindow, keyof DeliveryDistrictRow> = {
  morning: "morning_uah",
  afternoon: "afternoon_uah",
  evening: "evening_uah",
};

export function isDeliveryTimeWindow(v: string): v is DeliveryTimeWindow {
  return v === "morning" || v === "afternoon" || v === "evening";
}

/** Exact `max_km` from configured bands (client sends the tier they chose). */
export function bandDeliveryFeeUah(
  bands: DeliveryPricingBand[] | undefined,
  maxKm: number | null | undefined,
): number | null {
  if (!bands?.length || maxKm == null || !Number.isFinite(maxKm)) return null;
  const row = bands.find((b) => b.max_km === maxKm);
  if (!row) return null;
  const n = Number(row.price_uah);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function namedZoneDeliveryFeeUah(
  zones: DeliveryNamedZoneRow[] | undefined,
  zoneId: string | null | undefined,
): number | null {
  if (!zones?.length || !zoneId?.trim()) return null;
  const z = zones.find((row) => row.id === zoneId.trim());
  if (!z) return null;
  const n = Number(z.price_uah);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function districtDeliveryFeeUah(
  districts: DeliveryDistrictRow[] | undefined,
  districtId: string | null | undefined,
  timeWindow: string | null | undefined,
): number | null {
  if (!districts?.length || !districtId?.trim() || !timeWindow) return null;
  if (!isDeliveryTimeWindow(timeWindow)) return null;
  const row = districts.find((d) => d.id === districtId.trim());
  if (!row) return null;
  const key = WINDOW_KEYS[timeWindow];
  const n = Number(row[key]);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function parseDeliveryPricingConfig(raw: unknown): DeliveryPricingConfig {
  if (!raw || typeof raw !== "object") {
    return { bands: [], districts: [], zones: [] };
  }
  const o = raw as { bands?: unknown; districts?: unknown; zones?: unknown };
  const bands = parseBands(o.bands);
  const districts = parseDistricts(o.districts);
  const zones = parseNamedZonesArray(o.zones);
  return { bands, districts, zones };
}

export function parseDeliveryBandsFormJson(
  raw: FormDataEntryValue | null,
): DeliveryPricingBand[] {
  const s = typeof raw === "string" ? raw : "";
  try {
    return parseDeliveryPricingConfig(JSON.parse(s || "{}")).bands;
  } catch {
    return [];
  }
}

export function parseDeliveryDistrictsFormJson(
  raw: FormDataEntryValue | null,
): DeliveryDistrictRow[] {
  const s = typeof raw === "string" ? raw : "";
  try {
    return parseDeliveryPricingConfig(JSON.parse(s || "{}")).districts ?? [];
  } catch {
    return [];
  }
}

export function parseDeliveryZonesFormJson(
  raw: FormDataEntryValue | null,
): DeliveryNamedZoneRow[] {
  const s = typeof raw === "string" ? raw : "";
  try {
    return parseDeliveryPricingConfig(JSON.parse(s || "{}")).zones ?? [];
  } catch {
    return [];
  }
}

export function parseNamedZonesArray(raw: unknown): DeliveryNamedZoneRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const z = item as {
        id?: unknown;
        label_uk?: unknown;
        label_en?: unknown;
        description_uk?: unknown;
        description_en?: unknown;
        price_uah?: unknown;
      };
      const id = String(z.id ?? "").trim();
      const label_uk = String(z.label_uk ?? "").trim();
      const label_en = String(z.label_en ?? "").trim();
      const description_uk = String(z.description_uk ?? "").trim();
      const description_en = String(z.description_en ?? "").trim();
      const price_uah = Number(z.price_uah);
      if (!id || !label_uk || !label_en) return null;
      if (!Number.isFinite(price_uah) || price_uah < 0) return null;
      return {
        id,
        label_uk,
        label_en,
        ...(description_uk ? { description_uk } : {}),
        ...(description_en ? { description_en } : {}),
        price_uah,
      };
    })
    .filter((x): x is DeliveryNamedZoneRow => x != null);
}

function parseBands(raw: unknown): DeliveryPricingBand[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((b) => {
      const row = b as { max_km?: unknown; price_uah?: unknown };
      const max_km = Number(row.max_km);
      const price_uah = Number(row.price_uah);
      if (
        !Number.isFinite(max_km) ||
        !Number.isFinite(price_uah) ||
        max_km <= 0 ||
        price_uah < 0
      ) {
        return null;
      }
      return { max_km, price_uah };
    })
    .filter((x): x is DeliveryPricingBand => x != null)
    .sort((a, b) => a.max_km - b.max_km);
}

function parseDistricts(raw: unknown): DeliveryDistrictRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const d = item as {
        id?: unknown;
        label_uk?: unknown;
        label_en?: unknown;
        morning_uah?: unknown;
        afternoon_uah?: unknown;
        evening_uah?: unknown;
      };
      const id = String(d.id ?? "").trim();
      const label_uk = String(d.label_uk ?? "").trim();
      const label_en = String(d.label_en ?? "").trim();
      const morning_uah = Number(d.morning_uah);
      const afternoon_uah = Number(d.afternoon_uah);
      const evening_uah = Number(d.evening_uah);
      if (!id || !label_uk || !label_en) return null;
      if (
        !Number.isFinite(morning_uah) ||
        !Number.isFinite(afternoon_uah) ||
        !Number.isFinite(evening_uah) ||
        morning_uah < 0 ||
        afternoon_uah < 0 ||
        evening_uah < 0
      ) {
        return null;
      }
      return {
        id,
        label_uk,
        label_en,
        morning_uah,
        afternoon_uah,
        evening_uah,
      };
    })
    .filter((x): x is DeliveryDistrictRow => x != null);
}
