"use client";

import type { DeliveryDistrictRow } from "@/lib/types/database";
import { Button } from "@/components/admin/ui";
import { useState } from "react";

type Row = DeliveryDistrictRow & { key: string };

function emptyRow(key: string): Row {
  return {
    key,
    id: "",
    label_uk: "",
    label_en: "",
    morning_uah: 0,
    afternoon_uah: 0,
    evening_uah: 0,
  };
}

type Props = {
  initialDistricts: DeliveryDistrictRow[];
};

export function DeliveryDistrictsEditor({ initialDistricts }: Props) {
  const [rows, setRows] = useState<Row[]>(
    initialDistricts.length > 0
      ? initialDistricts.map((d, i) => ({ ...d, key: `d-${i}` }))
      : [emptyRow("d-0")],
  );

  const payload = {
    districts: rows
      .map((r) => ({
        id: r.id.trim(),
        label_uk: r.label_uk.trim(),
        label_en: r.label_en.trim(),
        morning_uah: Number(r.morning_uah),
        afternoon_uah: Number(r.afternoon_uah),
        evening_uah: Number(r.evening_uah),
      }))
      .filter(
        (d) =>
          d.id &&
          d.label_uk &&
          d.label_en &&
          Number.isFinite(d.morning_uah) &&
          Number.isFinite(d.afternoon_uah) &&
          Number.isFinite(d.evening_uah) &&
          d.morning_uah >= 0 &&
          d.afternoon_uah >= 0 &&
          d.evening_uah >= 0,
      ),
  };

  return (
    <div className="space-y-3">
      <p className="admin-meta">
        Район / зона та ціна доставки (₴) за орієнтовний інтервал часу. На вітрині
        клієнт обирає район і «ранок / день / вечір» — сума доставки додається до
        оплати (лише UAH).
      </p>
      <div className="space-y-4">
        {rows.map((row, index) => (
          <div
            key={row.key}
            className="grid gap-2 rounded-lg border border-zinc-200 p-3 sm:grid-cols-2 lg:grid-cols-6"
          >
            <label className="admin-label">
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
                placeholder="center"
              />
            </label>
            <label className="admin-label sm:col-span-2">
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
            <label className="admin-label sm:col-span-2">
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
            <label className="admin-label">
              <span className="mb-1 block">Ранок ₴</span>
              <input
                type="text"
                inputMode="numeric"
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={String(row.morning_uah)}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((prev) =>
                    prev.map((r, i) =>
                      i === index ? { ...r, morning_uah: Number(v) || 0 } : r,
                    ),
                  );
                }}
              />
            </label>
            <label className="admin-label">
              <span className="mb-1 block">День ₴</span>
              <input
                type="text"
                inputMode="numeric"
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={String(row.afternoon_uah)}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((prev) =>
                    prev.map((r, i) =>
                      i === index ? { ...r, afternoon_uah: Number(v) || 0 } : r,
                    ),
                  );
                }}
              />
            </label>
            <label className="admin-label">
              <span className="mb-1 block">Вечір ₴</span>
              <input
                type="text"
                inputMode="numeric"
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={String(row.evening_uah)}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((prev) =>
                    prev.map((r, i) =>
                      i === index ? { ...r, evening_uah: Number(v) || 0 } : r,
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
          setRows((prev) => [...prev, emptyRow(`d-${Date.now()}`)])
        }
      >
        + Додати район
      </Button>
      <input
        type="hidden"
        name="delivery_districts_json"
        value={JSON.stringify(payload)}
      />
    </div>
  );
}
