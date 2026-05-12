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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <div
          className="-mx-4 overflow-x-auto overscroll-x-contain px-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <nav
            className="flex snap-x snap-mandatory flex-nowrap items-center gap-x-4 py-1.5 md:flex-wrap md:gap-x-7 md:gap-y-2 md:py-2 md:snap-none"
          >
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
                    "shrink-0 snap-start whitespace-nowrap text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink md:text-sm md:tracking-[0.14em]",
                    active
                      ? "border-b-2 border-ink pb-0.5 text-ink"
                      : "border-b-2 border-transparent pb-0.5 text-muted hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
