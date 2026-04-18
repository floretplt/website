"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CategoryTabs() {
  const t = useTranslations("categories");
  const pathname = usePathname();

  const browse = PRODUCT_CATEGORIES.filter((id) => id !== "decor").map((id) => ({
    id,
    href: `/catalog/${id}`,
    label: t(id),
  }));

  const items = [{ id: "all", href: "/catalog", label: t("all") }, ...browse];

  const path = pathname?.replace(/\/$/, "") ?? "";

  return (
    <div className="border-b border-ink/10 bg-bg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3 md:gap-x-7 md:px-10">
        {items.map((item) => {
          const isAll = item.id === "all";
          const active = isAll
            ? path === "/catalog"
            : path === item.href || path.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors",
                active
                  ? "border-b-2 border-ink pb-0.5 text-ink"
                  : "text-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
