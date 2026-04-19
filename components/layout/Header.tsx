"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/layout/Logo";
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

        <nav className="hidden flex-1 items-center gap-6 lg:gap-8 md:flex">
          <Link href="/" className={linkClass}>
            {t("home")}
          </Link>
          <Link href="/catalog" className={linkClass}>
            {t("catalog")}
          </Link>
          <Link href="/#studio-team" className={linkClass}>
            {t("studioTeam")}
          </Link>
          <Link href="/contact" className={linkClass}>
            {t("contact")}
          </Link>
          <Link href="/order" className={linkClass}>
            {t("order")}
          </Link>
        </nav>

        <Link
          href="/"
          aria-label="Floret Poltava"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <Logo height={48} />
        </Link>

        <div className="flex flex-1 items-center justify-end gap-4 sm:gap-5">
          <Link href="/order-status" className={cn(linkClass, "max-w-[9rem] truncate text-right text-[10px] sm:max-w-none sm:text-[11px]")}>
            {t("orderStatus")}
          </Link>
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
            <Link href="/" className={linkClass} onClick={() => setOpen(false)}>
              {t("home")}
            </Link>
            <Link href="/catalog" className={linkClass} onClick={() => setOpen(false)}>
              {t("catalog")}
            </Link>
            <Link href="/#studio-team" className={linkClass} onClick={() => setOpen(false)}>
              {t("studioTeam")}
            </Link>
            <Link href="/contact" className={linkClass} onClick={() => setOpen(false)}>
              {t("contact")}
            </Link>
            <Link href="/order" className={linkClass} onClick={() => setOpen(false)}>
              {t("order")}
            </Link>
            <Link href="/order-status" className={linkClass} onClick={() => setOpen(false)}>
              {t("orderStatus")}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
