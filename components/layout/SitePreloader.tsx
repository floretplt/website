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
    let finished = false;

    const scheduleLeave = () => {
      if (finished) return;
      finished = true;
      const elapsed = Date.now() - started;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      window.setTimeout(() => setPhase("leave"), wait);
    };

    /** Safari (and others) may delay `load` until every subresource finishes; never rely on it alone. */
    const onDomOrLoad = () => scheduleLeave();

    const maxTimer = window.setTimeout(scheduleLeave, MAX_WAIT_MS);

    if (document.readyState === "complete") {
      scheduleLeave();
    } else if (document.readyState === "interactive") {
      scheduleLeave();
    } else {
      document.addEventListener("DOMContentLoaded", onDomOrLoad, { once: true });
      window.addEventListener("load", onDomOrLoad, { once: true });
    }

    return () => {
      document.removeEventListener("DOMContentLoaded", onDomOrLoad);
      window.removeEventListener("load", onDomOrLoad);
      window.clearTimeout(maxTimer);
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
