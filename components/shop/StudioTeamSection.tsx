import Image from "next/image";
import { SectionHeading } from "@/components/shop/SectionHeading";
import { TeamSection } from "@/components/shop/TeamSection";
import { splitStudioAbout } from "@/lib/studio-about";
import type { TeamMemberConfig, TeamMemberId } from "@/lib/team";

const STUDIO_PHOTO = "/images/studio/studio-team.jpg";

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
  const { introBlocks, subheading, closingBlocks } = splitStudioAbout(aboutText);

  const bodyClass = "text-body-muted mt-4 md:mt-6";

  return (
    <section
      id="studio-team"
      className="scroll-mt-24 border-t border-ink/10 bg-gradient-to-b from-[#faf9f7] via-bg to-[#faf9f7] pb-0 pt-20 md:pt-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-10">
        <SectionHeading title={sectionTitle} />

        <div className="mt-10 grid grid-cols-1 gap-y-6 md:mt-16 md:grid-cols-12 md:items-start md:gap-x-10 md:gap-y-4 lg:gap-x-16">
          <div className="order-2 md:order-1 md:col-span-5 md:mt-0 lg:col-span-5">
            <div className="relative mx-auto max-w-lg border-l border-ink/12 pl-6 sm:pl-7 md:mx-0 md:max-w-none md:pl-9">
              <span
                className="absolute left-[-1px] top-0 h-20 w-px bg-gradient-to-b from-rose/60 via-sage/40 to-transparent"
                aria-hidden
              />
              {introBlocks.map((p, i) =>
                i === 0 ? (
                  <p
                    key={`intro-${i}`}
                    className="h-subsection"
                  >
                    {p}
                  </p>
                ) : (
                  <p key={`intro-${i}`} className={bodyClass}>
                    {p}
                  </p>
                ),
              )}
              {subheading ? (
                <h3 className="h-card mt-6 font-medium text-rose max-md:mt-5 md:mt-9">
                  {subheading}
                </h3>
              ) : null}
              {closingBlocks.map((p, i) => (
                <p
                  key={`close-${i}`}
                  className={
                    i === 0 && subheading
                      ? "text-body-muted mt-4 md:mt-5"
                      : bodyClass
                  }
                >
                  {p}
                </p>
              ))}
            </div>
          </div>

          <div className="relative order-1 md:order-2 md:col-span-7 lg:col-span-7">
            <div
              className="pointer-events-none absolute -bottom-5 left-0 right-[14%] top-[14%] rounded-[1.85rem] bg-sage/18 max-md:hidden md:-bottom-6 md:rounded-[2.1rem]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-0 right-0 h-36 w-52 translate-x-[22%] translate-y-[18%] rounded-full bg-rose/15 blur-3xl max-md:hidden md:h-44 md:w-60"
              aria-hidden
            />
            <figure className="relative mx-auto aspect-[5/4] w-full max-md:mx-0 md:aspect-[4/3] md:mx-0 md:translate-x-0.5 lg:translate-x-2">
              <div className="relative h-full w-full overflow-hidden rounded-[1.25rem] bg-ink/[0.035] shadow-[0_28px_70px_-22px_rgba(28,28,26,0.22),0_10px_28px_-12px_rgba(28,28,26,0.1)] ring-1 ring-ink/[0.05] md:rounded-[1.85rem]">
                <Image
                  src={STUDIO_PHOTO}
                  alt={sectionTitle}
                  fill
                  className="object-cover object-[center_28%] md:object-contain md:object-center"
                  sizes="(max-width:768px) 100vw, 58vw"
                />
              </div>
            </figure>
          </div>
        </div>

        <div
          className="mx-auto mt-10 h-px max-w-lg bg-gradient-to-r from-transparent via-ink/12 to-transparent md:mt-20"
          aria-hidden
        />
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
