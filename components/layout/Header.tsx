"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/layout/Logo";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { InstagramIcon } from "@/components/icons/Instagram";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass =
    "text-[11px] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:text-rose";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors",
        scrolled ? "border-ink/10 bg-bg/95 backdrop-blur-sm" : "border-transparent bg-bg",
      )}
    >
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5 md:px-10">
        <button
          type="button"
          className="md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block h-0.5 w-6 bg-ink" />
          <span className="mt-1.5 block h-0.5 w-6 bg-ink" />
        </button>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/catalog" className={linkClass}>
            {t("catalog")}
          </Link>
          <Link href="/about" className={linkClass}>
            {t("about")}
          </Link>
          <Link href="/contact" className={linkClass}>
            {t("contact")}
          </Link>
          <Link href="/order-status" className={linkClass}>
            {t("orderStatus")}
          </Link>
        </nav>

        <Link
          href="/"
          aria-label="Floret Poltava"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <Logo height={48} />
        </Link>

        <div className="flex items-center gap-5">
          <LanguageToggle />
          <a
            href="https://www.instagram.com/floret_poltava/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink transition-colors hover:text-rose"
            aria-label={t("instagram")}
          >
            <InstagramIcon className="h-5 w-5" />
          </a>
        </div>
      </div>

      {open ? (
        <div className="border-t border-ink/10 bg-bg px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link href="/catalog" className={linkClass} onClick={() => setOpen(false)}>
              {t("catalog")}
            </Link>
            <Link href="/about" className={linkClass} onClick={() => setOpen(false)}>
              {t("about")}
            </Link>
            <Link href="/contact" className={linkClass} onClick={() => setOpen(false)}>
              {t("contact")}
            </Link>
            <Link href="/order-status" className={linkClass} onClick={() => setOpen(false)}>
              {t("orderStatus")}
            </Link>
            <Link href="/order" className={linkClass} onClick={() => setOpen(false)}>
              {t("order")}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
