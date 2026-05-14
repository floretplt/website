import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Unused; kept so call sites do not need edits. */
  delayMs?: number;
};

/** Stable wrapper (scroll-in animation removed — was unreliable in Safari). */
export function Reveal({ children, className, delayMs: _delayMs = 0 }: Props) {
  return <div className={cn("reveal-scope", className)}>{children}</div>;
}
