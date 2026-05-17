"use client";

import type { DeliveryPricingBand } from "@/lib/types/database";
import { Button } from "@/components/admin/ui";
import { useState } from "react";

type Props = {
  initialBands: DeliveryPricingBand[];
};

export function DeliveryBandsEditor({ initialBands }: Props) {
  const [rows, setRows] = useState<
    { max_km: string; price_uah: string; key: string }[]
  >(
    initialBands.length > 0
      ? initialBands.map((b, i) => ({
          max_km: String(b.max_km),
          price_uah: String(b.price_uah),
          key: `r-${i}`,
        }))
      : [{ max_km: "", price_uah: "", key: "r-0" }],
  );

  return (
    <div className="space-y-3">
      <p className="admin-meta">
        Відстань — максимум кілометрів для рядка (наприклад 5 = «до 5 км»). Ціни
        орієнтовні; узгоджуйте фінальну суму з клієнтом.
      </p>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={row.key} className="flex flex-wrap items-end gap-2">
            <label className="admin-label">
              <span className="mb-1 block">До (км)</span>
              <input
                type="text"
                inputMode="decimal"
                className="w-24 rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={row.max_km}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((prev) =>
                    prev.map((r, i) => (i === index ? { ...r, max_km: v } : r)),
                  );
                }}
              />
            </label>
            <label className="admin-label">
              <span className="mb-1 block">Ціна (₴)</span>
              <input
                type="text"
                inputMode="numeric"
                className="w-28 rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={row.price_uah}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((prev) =>
                    prev.map((r, i) =>
                      i === index ? { ...r, price_uah: v } : r,
                    ),
                  );
                }}
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setRows((prev) => prev.filter((_, i) => i !== index))
              }
            >
              Видалити
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() =>
          setRows((prev) => [
            ...prev,
            {
              max_km: "",
              price_uah: "",
              key: `r-${Date.now()}`,
            },
          ])
        }
      >
        + Додати рядок
      </Button>
      <input
        type="hidden"
        name="delivery_bands_json"
        value={JSON.stringify({
          bands: rows
            .map((r) => ({
              max_km: Number(String(r.max_km).replace(",", ".")),
              price_uah: Number(String(r.price_uah).replace(",", ".")),
            }))
            .filter(
              (b) =>
                Number.isFinite(b.max_km) &&
                Number.isFinite(b.price_uah) &&
                b.max_km > 0 &&
                b.price_uah >= 0,
            )
            .sort((a, b) => a.max_km - b.max_km),
        })}
      />
    </div>
  );
}
