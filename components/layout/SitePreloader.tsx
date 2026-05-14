"use client";

import { PreloaderMark } from "@/components/layout/PreloaderMark";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type Phase = "enter" | "leave" | "gone";

const MIN_VISIBLE_MS = 750;
const MAX_WAIT_MS = 12000;

export function SitePreloader() {
  const [phase, setPhase] = useState<Phase>("enter");

  useEffect(() => {
    const started = Date.now();
    /** Browser timers are numeric IDs; avoid `NodeJS.Timeout` from `@types/node` in client code. */
    let leaveTimer: number | undefined;

    const scheduleLeave = () => {
      const elapsed = Date.now() - started;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      leaveTimer = window.setTimeout(() => setPhase("leave"), wait);
    };

    /** Hydration has run — do not wait for `window` "load" (Mac Safari can defer it indefinitely). */
    scheduleLeave();

    const maxTimer = window.setTimeout(() => {
      setPhase((p) => (p === "enter" ? "leave" : p));
    }, MAX_WAIT_MS);

    return () => {
      window.clearTimeout(maxTimer);
      if (leaveTimer !== undefined) window.clearTimeout(leaveTimer);
    };
  }, []);

  useEffect(() => {
    if (phase !== "leave") return;
    const t = window.setTimeout(() => setPhase("gone"), 1000);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      id="site-preloader"
      aria-hidden={phase === "leave"}
      className={cn(
        "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-bg transition-opacity duration-700 ease-out motion-reduce:duration-300",
        phase === "leave" ? "pointer-events-none opacity-0" : "opacity-100",
      )}
      onTransitionEnd={(e) => {
        if (
          e.target === e.currentTarget &&
          e.propertyName === "opacity" &&
          phase === "leave"
        ) {
          setPhase("gone");
        }
      }}
    >
      <PreloaderMark />
    </div>
  );
}
