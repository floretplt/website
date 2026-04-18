"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  toggleProductAvailability,
  toggleProductFeatured,
} from "@/lib/actions/admin";
import { Switch } from "./ui";

/** Client-side switch that calls a server action and optimistically updates. */
export function ProductToggle({
  id,
  which,
  initial,
  /** When false, «На головній» is disabled (no featured without stock). */
  productAvailable = true,
}: {
  id: string;
  which: "available" | "featured";
  initial: boolean;
  productAvailable?: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(initial);
  const [pending, startTransition] = useTransition();

  const handleChange = (next: boolean) => {
    const prev = checked;
    setChecked(next);
    startTransition(async () => {
      try {
        if (which === "available") {
          await toggleProductAvailability(id, next);
        } else {
          await toggleProductFeatured(id, next);
        }
        router.refresh();
      } catch {
        setChecked(prev);
      }
    });
  };

  return (
    <Switch
      checked={checked}
      disabled={pending || (which === "featured" && !productAvailable)}
      onChange={handleChange}
    />
  );
}
