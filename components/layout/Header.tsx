"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/layout/Logo";
import { InstagramIcon } from "@/components/icons/Instagram";
import { PhoneIcon } from "@/components/icons/Phone";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const [sheetTopPx, setSheetTopPx] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onWiden = () => setOpen(false);
    mq.addEventListener("change", onWiden);
    return () => mq.removeEventListener("change", onWiden);
  }, []);

  /**
   * Lock scroll via overflow (no `body position: fixed` + negative top — that shifts the
   * whole document up so the sticky header leaves the viewport: hamburger / “X” disappear).
   * While the sheet is open, the header uses `fixed` on small screens so it stays visible.
   */
  useLayoutEffect(() => {
    if (!open) return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    const measure = () => {
      const el = barRef.current;
      if (!el) return;
      setSheetTopPx(Math.round(el.getBoundingClientRect().bottom));
    };
    measure();
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("resize", measure);
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [open]);

  const linkClass = "nav-link";

  const mobileMenuOpen = open;

  return (
    <>
      {/* Keeps layout from jumping when the real header is `position: fixed` */}
      {mobileMenuOpen ? (
        <div
          aria-hidden
          className="md:hidden"
          style={{
            height: sheetTopPx > 0 ? `${sheetTopPx}px` : "4.75rem",
          }}
        />
      ) : null}
      <header
        className={cn(
          "border-b transition-[background-color,border-color,backdrop-filter] duration-300 ease-out",
          mobileMenuOpen
            ? cn(
                "z-[100] max-md:fixed max-md:left-0 max-md:right-0 max-md:top-0 max-md:border-ink/10 max-md:bg-bg max-md:shadow-sm",
                "md:sticky md:top-0 md:z-50",
                scrolled
                  ? "md:border-ink/10 md:bg-bg/95 md:backdrop-blur-sm"
                  : "md:border-transparent md:bg-bg",
              )
            : cn(
                "sticky top-0 z-50",
                scrolled ? "border-ink/10 bg-bg/95 backdrop-blur-sm" : "border-transparent bg-bg",
              ),
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
      <div
        ref={barRef}
        className="relative z-50 mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-4 sm:gap-4 sm:px-6 md:px-10 md:py-5"
      >
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
          <Link
            href="/order-status"
            className={cn(
              linkClass,
              "hidden min-w-0 text-right md:inline-flex md:max-w-none",
            )}
          >
            {t("orderStatus")}
          </Link>
          <a
            href="tel:+380662789828"
            className="hidden h-10 shrink-0 items-center justify-center gap-2 text-ink transition-colors hover:text-rose sm:flex"
            aria-label={`${t("phone")} 066 278 9828`}
          >
            <PhoneIcon className="h-[1.15rem] w-[1.15rem]" />
            <span className="text-sm font-medium tabular-nums text-ink">
              066 278 9828
            </span>
          </a>
          <a
            href="tel:+380662789828"
            className="flex h-10 w-10 shrink-0 items-center justify-center text-ink transition-colors hover:text-rose sm:hidden"
            aria-label={`${t("phone")} 066 278 9828`}
          >
            <PhoneIcon className="h-5 w-5" />
          </a>
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
        <div
          className="fixed inset-x-0 bottom-0 z-[45] flex max-h-none flex-col overscroll-contain border-t border-ink/[0.06] bg-white/[0.88] shadow-[0_-8px_40px_-12px_rgba(28,28,26,0.12)] backdrop-blur-xl backdrop-saturate-150 md:hidden motion-reduce:animate-none animate-sheetIn"
          style={{
            top: sheetTopPx > 0 ? `${sheetTopPx}px` : "4.75rem",
          }}
        >
          <nav
            className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-1 overflow-y-auto overscroll-y-contain px-5 pb-10 pt-5 sm:px-8"
            aria-label={t("menu")}
          >
            {(
              [
                ["/", "home"],
                ["/catalog", "catalog"],
                ["/delivery", "delivery"],
                ["/contact", "contact"],
              ] as const
            ).map(([href, key]) => (
              <Link
                key={href}
                href={href}
                className="rounded-2xl px-5 py-4 text-base font-medium text-ink transition-[background-color,color] duration-200 ease-out hover:bg-ink/[0.05] active:bg-ink/[0.07]"
                onClick={() => setOpen(false)}
              >
                {t(key)}
              </Link>
            ))}
            <div className="mt-6 border-t border-ink/[0.08] pt-6">
              <Link
                href="/order-status"
                className="flex min-h-[3.25rem] items-center justify-between gap-4 rounded-2xl bg-sage/25 px-5 py-4 text-base font-semibold text-ink ring-1 ring-ink/[0.06] transition-[background-color,ring-color,transform] duration-200 ease-out hover:bg-sage/35 hover:ring-ink/12 active:scale-[0.99]"
                onClick={() => setOpen(false)}
              >
                <span>{t("orderStatus")}</span>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg/80 text-lg text-ink/70 ring-1 ring-ink/10"
                  aria-hidden
                >
                  →
                </span>
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
    </>
  );
}
