"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Stagger when several siblings enter the viewport together */
  delayMs?: number;
};

export function Reveal({ children, className, delayMs = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    const show = () => {
      setShown(true);
    };

    /** Safari can fail to intersect when `rootMargin` uses %; also cover “already in view” before IO runs. */
    const inView = () => {
      const r = el.getBoundingClientRect();
      const h = window.innerHeight || document.documentElement?.clientHeight || 0;
      return r.top < h && r.bottom > 0;
    };

    if (inView()) {
      show();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            show();
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "0px 0px -32px 0px", threshold: 0.01 },
    );
    io.observe(el);

    const raf = requestAnimationFrame(() => {
      if (inView()) {
        show();
        io.disconnect();
      }
    });

    const fallback = window.setTimeout(() => {
      show();
      io.disconnect();
    }, 4000);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "reveal-scope will-change-[transform,opacity]",
        "transition-[opacity,transform] duration-[780ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        shown
          ? "translate-y-0 opacity-100"
          : "translate-y-7 opacity-0",
        className,
      )}
      style={shown ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
