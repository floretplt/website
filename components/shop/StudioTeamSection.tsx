import { SectionHeading } from "@/components/shop/SectionHeading";
import { TeamSection } from "@/components/shop/TeamSection";
import type { TeamMemberConfig, TeamMemberId } from "@/lib/team";

type Props = {
  sectionTitle: string;
  aboutText: string;
  teamTitle: string;
  placeholderLabel: string;
  names: Record<TeamMemberId, string>;
  bios: Record<TeamMemberId, string>;
  members: TeamMemberConfig[];
};

/** Merged «Про студію» copy + team grid with shared anchor for nav. */
export function StudioTeamSection({
  sectionTitle,
  aboutText,
  teamTitle,
  placeholderLabel,
  names,
  bios,
  members,
}: Props) {
  return (
    <section
      id="studio-team"
      className="scroll-mt-24 border-t border-ink/10 py-20 md:py-28"
    >
      <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
        <SectionHeading title={sectionTitle} />
        <p className="mt-8 whitespace-pre-line font-display text-xl leading-relaxed text-muted md:text-2xl">
          {aboutText}
        </p>
      </div>
      <TeamSection
        title={teamTitle}
        placeholderLabel={placeholderLabel}
        names={names}
        bios={bios}
        members={members}
        embedded
      />
    </section>
  );
}
