import Image from "next/image";
import { SectionHeading } from "@/components/shop/SectionHeading";
import type { TeamMemberConfig, TeamMemberId } from "@/lib/team";

type Props = {
  title: string;
  placeholderLabel: string;
  names: Record<TeamMemberId, string>;
  bios: Record<TeamMemberId, string>;
  members: TeamMemberConfig[];
  /** When true, no outer border — for use inside `StudioTeamSection`. */
  embedded?: boolean;
};

export function TeamSection({
  title,
  placeholderLabel,
  names,
  bios,
  members,
  embedded = false,
}: Props) {
  const outerClass = embedded
    ? "pt-16 md:pt-20"
    : "border-t border-ink/10 py-20 md:py-28";
  const Tag = embedded ? "div" : "section";
  return (
    <Tag className={outerClass}>
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <SectionHeading title={title} />

        <div className="mt-14 grid gap-14 sm:grid-cols-3 sm:gap-10">
          {members.map((member) => (
            <article key={member.id} className="flex flex-col text-left">
              <div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden border border-ink/10 bg-ink/[0.03] sm:mx-0">
                {member.photoSrc ? (
                  <Image
                    src={member.photoSrc}
                    alt={names[member.id]}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width:640px) 90vw, 280px"
                    loading="lazy"
                    fetchPriority="low"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4">
                    <span className="font-display text-3xl text-ink/25 md:text-4xl">
                      —
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
                      {placeholderLabel}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="mt-6 font-display text-xl text-ink md:text-2xl">
                {names[member.id]}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted md:text-[15px]">
                {bios[member.id]}
              </p>
            </article>
          ))}
        </div>
      </div>
    </Tag>
  );
}
