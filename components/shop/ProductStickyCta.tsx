"use client";

import { Link } from "@/i18n/navigation";

type Props = {
  href: string;
  label: string;
  disabled?: boolean;
};

export function ProductStickyCta({ href, label, disabled }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink/10 bg-bg/95 p-4 backdrop-blur-sm md:hidden">
      <Link
        href={href}
        className={`btn-pill flex w-full justify-center ${
          disabled ? "pointer-events-none opacity-40" : ""
        }`}
        aria-disabled={disabled}
      >
        {label}
      </Link>
    </div>
  );
}
