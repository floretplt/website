import type {
  DeliveryNamedZoneRow,
  DeliveryPricingConfig,
} from "@/lib/types/database";
import { parseNamedZonesArray } from "@/lib/delivery-pricing";

/**
 * Built-in Poltava delivery areas when `site_settings.delivery_pricing` has no
 * districts, bands, or custom `zones`. Editable in Admin → Settings → «Зони доставки».
 */
export const DEFAULT_POLTAVA_DELIVERY_ZONES: readonly DeliveryNamedZoneRow[] = [
  {
    id: "poltava_center_podil",
    label_uk: "Центр, Поділ",
    label_en: "City center, Podil",
    price_uah: 200,
  },
  {
    id: "poltava_levada_inst_zvyazku",
    label_uk: "Левада, Інст. зв'язку",
    label_en: "Levada, Institute of Communications",
    price_uah: 250,
  },
  {
    id: "poltava_lisok_cluster",
    label_uk:
      "Лісок, Дублянщина, Алмазний, Мотель, Сади, Половки, Садовий",
    label_en:
      "Lisok, Dublyanshchyna, Almaznyi, Motel, Sady, Polovky, Sadovyi",
    price_uah: 300,
  },
  {
    id: "poltava_outside_city",
    label_uk: "За межами міста",
    label_en: "Outside the city",
    description_uk:
      "Гожули, Рибці, Розсошенці, Горбанівка, Щербані, Супрунівка",
    description_en:
      "Hozhuly, Rybtsi, Rozsoshentsi, Horbanivka, Shcherbani, Suprunivka",
    price_uah: 350,
  },
  {
    id: "poltava_relax_park_verholy",
    label_uk: "Relax Park Verholy",
    label_en: "Relax Park Verholy",
    price_uah: 600,
  },
];

/**
 * Custom `zones` from admin wins. Otherwise: no named zones if districts or bands
 * are configured; else built-in Poltava list.
 */
export function getEffectiveNamedZones(
  pricing: DeliveryPricingConfig | null | undefined,
): DeliveryNamedZoneRow[] {
  const p = pricing ?? { bands: [], districts: [], zones: [] };
  const fromDb = parseNamedZonesArray(p.zones);
  if (fromDb.length > 0) return fromDb;
  if ((p.districts ?? []).length > 0) return [];
  if ((p.bands ?? []).length > 0) return [];
  return [...DEFAULT_POLTAVA_DELIVERY_ZONES];
}
