type Props = {
  message: string | null;
};

export async function AnnouncementBar({ message }: Props) {
  if (!message?.trim()) return null;
  return (
    <div className="border-b border-ink/10 bg-sage/30 py-2 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-ink">
      <span className="text-balance">{message}</span>
    </div>
  );
}
