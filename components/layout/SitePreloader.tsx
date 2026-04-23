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

    const onLoad = () => scheduleLeave();

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
    }

    const maxTimer = window.setTimeout(scheduleLeave, MAX_WAIT_MS);

    return () => {
      window.removeEventListener("load", onLoad);
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
