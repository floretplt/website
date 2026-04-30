type Props = {
  message: string | null;
};

export async function AnnouncementBar({ message }: Props) {
  if (!message?.trim()) return null;
  return (
    <div className="border-b border-ink/10 bg-sage/30 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))] text-center text-sm font-medium uppercase tracking-[0.14em] text-ink max-sm:tracking-[0.1em] md:text-[11px] md:tracking-[0.2em]">
      <span className="text-balance">{message}</span>
    </div>
  );
}
