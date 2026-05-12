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
    ? "w-full bg-transparent pt-12 md:pt-16 pb-20 md:pb-28"
    : "border-t border-ink/10 bg-bg py-20 md:py-28";
  const Tag = embedded ? "div" : "section";
  return (
    <Tag className={outerClass}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-10">
        <SectionHeading title={title} />

        <div className="mt-12 grid grid-cols-1 gap-14 sm:mt-14 sm:grid-cols-3 sm:gap-10 md:gap-12 lg:gap-16">
          {members.map((member) => (
            <article
              key={member.id}
              className="flex h-full flex-col text-left sm:max-w-none"
            >
              <div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden bg-ink/[0.04] sm:mx-0 sm:max-w-none">
                {member.photoSrc ? (
                  <Image
                    src={member.photoSrc}
                    alt={names[member.id]}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width:640px) 90vw, (max-width:1024px) 30vw, 320px"
                    loading="lazy"
                    fetchPriority="low"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4">
                    <span className="font-display text-3xl text-ink/25 md:text-4xl">
                      —
                    </span>
                    <span className="text-sm font-medium uppercase tracking-[0.12em] text-muted md:text-xs md:tracking-[0.2em]">
                      {placeholderLabel}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="mt-5 font-display text-xl font-medium tracking-tight text-ink md:mt-6 md:text-2xl">
                {names[member.id]}
              </h3>
              <p className="mt-3 max-w-prose font-sans text-base font-normal leading-relaxed text-muted md:mt-4">
                {bios[member.id]}
              </p>
            </article>
          ))}
        </div>
      </div>
    </Tag>
  );
}
