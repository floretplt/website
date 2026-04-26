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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const linkClass =
    "text-[11px] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:text-rose";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors",
        scrolled ? "border-ink/10 bg-bg/95 backdrop-blur-sm" : "border-transparent bg-bg",
      )}
    >
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/25 md:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className="relative z-50 mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-4 sm:gap-4 sm:px-6 md:px-10 md:py-5">
        <div className="flex min-w-0 items-center gap-4 lg:gap-8">
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md outline-none ring-ink focus-visible:ring-2 md:hidden"
            aria-label={open ? "Close menu" : "Menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="flex w-5 flex-col gap-1.5" aria-hidden>
              <span
                className={cn(
                  "block h-0.5 origin-center bg-ink transition-transform duration-200",
                  open && "translate-y-[7px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "block h-0.5 bg-ink transition-opacity duration-200",
                  open && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "block h-0.5 origin-center bg-ink transition-transform duration-200",
                  open && "-translate-y-[7px] -rotate-45",
                )}
              />
            </span>
          </button>

          <nav className="hidden min-w-0 items-center gap-6 lg:gap-8 md:flex">
            <Link href="/" className={linkClass}>
              {t("home")}
            </Link>
            <Link href="/catalog" className={linkClass}>
              {t("catalog")}
            </Link>
            <Link href="/delivery" className={linkClass}>
              {t("delivery")}
            </Link>
            <Link href="/contact" className={linkClass}>
              {t("contact")}
            </Link>
          </nav>
        </div>

        <Link
          href="/"
          aria-label="Floret Poltava"
          className="flex shrink-0 justify-self-center text-ink outline-none ring-ink focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <span className="md:hidden">
            <Logo height={42} />
          </span>
          <span className="hidden md:inline">
            <Logo height={48} />
          </span>
        </Link>

        <div className="flex min-w-0 items-center justify-end justify-self-end gap-2 sm:gap-4 md:gap-5">
          <div className="hidden sm:block">
            <LanguageToggle />
          </div>
          <Link
            href="/order-status"
            className={cn(
              linkClass,
              "min-w-0 max-w-[7.25rem] truncate text-right text-[10px] min-[380px]:max-w-[9rem] sm:max-w-none sm:text-[11px]",
            )}
          >
            {t("orderStatus")}
          </Link>
          <a
            href="https://www.instagram.com/floret_poltava/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 shrink-0 items-center justify-center text-ink transition-colors hover:text-rose"
            aria-label={t("instagram")}
          >
            <InstagramIcon className="h-5 w-5" />
          </a>
        </div>
      </div>

      {open ? (
        <div className="relative z-50 max-h-[min(70vh,calc(100dvh-5rem))] overflow-y-auto overscroll-y-contain border-t border-ink/10 bg-bg px-4 py-4 shadow-lg sm:px-6 md:hidden">
            <div className="flex flex-col gap-1">
              <Link
                href="/"
                className={cn(linkClass, "py-3")}
                onClick={() => setOpen(false)}
              >
                {t("home")}
              </Link>
              <Link
                href="/catalog"
                className={cn(linkClass, "py-3")}
                onClick={() => setOpen(false)}
              >
                {t("catalog")}
              </Link>
              <Link
                href="/delivery"
                className={cn(linkClass, "py-3")}
                onClick={() => setOpen(false)}
              >
                {t("delivery")}
              </Link>
              <Link
                href="/contact"
                className={cn(linkClass, "py-3")}
                onClick={() => setOpen(false)}
              >
                {t("contact")}
              </Link>
              <Link
                href="/order-status"
                className={cn(linkClass, "py-3")}
                onClick={() => setOpen(false)}
              >
                {t("orderStatus")}
              </Link>
              <div className="mt-2 border-t border-ink/10 pt-4 sm:hidden">
                <LanguageToggle />
              </div>
            </div>
          </div>
      ) : null}
    </header>
  );
}
