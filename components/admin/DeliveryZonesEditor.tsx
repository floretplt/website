"use client";

import type { DeliveryNamedZoneRow } from "@/lib/types/database";
import { Button } from "@/components/admin/ui";
import { useState } from "react";

type Row = DeliveryNamedZoneRow & { key: string };

function emptyRow(key: string): Row {
  return {
    key,
    id: "",
    label_uk: "",
    label_en: "",
    description_uk: "",
    description_en: "",
    price_uah: 0,
  };
}

type Props = {
  initialZones: DeliveryNamedZoneRow[];
};

export function DeliveryZonesEditor({ initialZones }: Props) {
  const [rows, setRows] = useState<Row[]>(
    initialZones.length > 0
      ? initialZones.map((z, i) => ({
          ...z,
          description_uk: z.description_uk ?? "",
          description_en: z.description_en ?? "",
          key: `z-${i}`,
        }))
      : [emptyRow("z-0")],
  );

  const payload = {
    zones: rows
      .map((r) => ({
        id: r.id.trim(),
        label_uk: r.label_uk.trim(),
        label_en: r.label_en.trim(),
        ...(r.description_uk?.trim()
          ? { description_uk: r.description_uk.trim() }
          : {}),
        ...(r.description_en?.trim()
          ? { description_en: r.description_en.trim() }
          : {}),
        price_uah: Number(r.price_uah),
      }))
      .filter(
        (z) =>
          z.id &&
          z.label_uk &&
          z.label_en &&
          Number.isFinite(z.price_uah) &&
          z.price_uah >= 0,
      ),
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Названі зони з фіксованою ціною доставки (₴). Якщо залишити порожнім і не
        заповнювати «райони за часом» та «відстань км», на сайті підставляться
        стандартні зони Полтави з актуальним прайсом у коді.
      </p>
      <div className="space-y-4">
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="grid gap-2 rounded-lg border border-zinc-200 p-3 sm:grid-cols-2 lg:grid-cols-6"
          >
            <label className="text-xs text-zinc-600">
              <span className="mb-1 block">ID (латиницею)</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={row.id}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((prev) =>
                    prev.map((r, i) => (i === index ? { ...r, id: v } : r)),
                  );
                }}
                placeholder="poltava_center"
              />
            </label>
            <label className="text-xs text-zinc-600 sm:col-span-2">
              <span className="mb-1 block">Назва (UK)</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={row.label_uk}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((prev) =>
                    prev.map((r, i) => (i === index ? { ...r, label_uk: v } : r)),
                  );
                }}
              />
            </label>
            <label className="text-xs text-zinc-600 sm:col-span-2">
              <span className="mb-1 block">Назва (EN)</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={row.label_en}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((prev) =>
                    prev.map((r, i) => (i === index ? { ...r, label_en: v } : r)),
                  );
                }}
              />
            </label>
            <label className="text-xs text-zinc-600">
              <span className="mb-1 block">Ціна ₴</span>
              <input
                type="text"
                inputMode="numeric"
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={String(row.price_uah)}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((prev) =>
                    prev.map((r, i) =>
                      i === index ? { ...r, price_uah: Number(v) || 0 } : r,
                    ),
                  );
                }}
              />
            </label>
            <label className="text-xs text-zinc-600 sm:col-span-3 lg:col-span-6">
              <span className="mb-1 block">Підпис (UK), необов’язково</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={row.description_uk ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((prev) =>
                    prev.map((r, i) =>
                      i === index ? { ...r, description_uk: v } : r,
                    ),
                  );
                }}
                placeholder="Села, орієнтири…"
              />
            </label>
            <label className="text-xs text-zinc-600 sm:col-span-3 lg:col-span-6">
              <span className="mb-1 block">Підпис (EN), optional</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={row.description_en ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((prev) =>
                    prev.map((r, i) =>
                      i === index ? { ...r, description_en: v } : r,
                    ),
                  );
                }}
              />
            </label>
            <div className="flex items-end sm:col-span-2 lg:col-span-6">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  setRows((prev) => prev.filter((_, i) => i !== index))
                }
              >
                Видалити рядок
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() =>
          setRows((prev) => [...prev, emptyRow(`z-${Date.now()}`)])
        }
      >
        + Додати зону
      </Button>
      <input
        type="hidden"
        name="delivery_zones_json"
        value={JSON.stringify(payload)}
      />
    </div>
  );
}
