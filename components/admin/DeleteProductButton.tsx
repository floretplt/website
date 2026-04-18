"use client";

import { deleteProduct } from "@/lib/actions/products-crud";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { IconTrash } from "./icons";

type Props = {
  id: string;
  name: string;
  className?: string;
};

export function DeleteProductButton({ id, name, className }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    const ok = window.confirm(
      `Видалити «${name}» з каталогу? Цю дію не можна скасувати.`,
    );
    if (!ok) return;
    startTransition(async () => {
      try {
        await deleteProduct(id);
        router.refresh();
      } catch (e) {
        window.alert(
          e instanceof Error ? e.message : "Не вдалося видалити товар.",
        );
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50",
        className,
      )}
      aria-label={`Видалити ${name}`}
    >
      <IconTrash size={14} />
      {pending ? "…" : "Видалити"}
    </button>
  );
}
