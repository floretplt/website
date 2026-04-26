import Image from "next/image";
import { SectionHeading } from "@/components/shop/SectionHeading";
import { TeamSection } from "@/components/shop/TeamSection";
import type { Locale } from "@/i18n/routing";
import { splitStudioAbout } from "@/lib/studio-about";
import type { TeamMemberConfig, TeamMemberId } from "@/lib/team";

const STUDIO_PHOTO = "/images/studio/studio-team.jpg";

type Props = {
  locale: Locale;
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
  locale,
  sectionTitle,
  aboutText,
  teamTitle,
  placeholderLabel,
  names,
  bios,
  members,
}: Props) {
  const { introBlocks, subheading, closingBlocks } = splitStudioAbout(
    aboutText,
    locale,
  );

  const bodyClass =
    "mt-5 text-[15px] leading-[1.75] text-muted md:mt-6 md:text-base md:leading-[1.7]";

  return (
    <section
      id="studio-team"
      className="scroll-mt-24 border-t border-ink/10 bg-gradient-to-b from-bg via-rose/[0.04] to-bg py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-10">
        <SectionHeading title={sectionTitle} />

        <div className="mt-14 md:mt-16 md:grid md:grid-cols-12 md:items-start md:gap-x-10 lg:gap-x-14">
          <div className="order-2 mt-12 md:order-1 md:col-span-5 md:mt-0 lg:col-span-5">
            <div className="relative border-l border-ink/12 pl-7 md:pl-9">
              <span
                className="absolute left-[-1px] top-0 h-16 w-px bg-gradient-to-b from-rose/50 via-sage/35 to-transparent"
                aria-hidden
              />
              {introBlocks.map((p, i) =>
                i === 0 ? (
                  <p
                    key={`intro-${i}`}
                    className="font-display text-[1.35rem] font-normal leading-snug tracking-tight text-ink md:text-2xl"
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
                <h3 className="mt-7 font-display text-lg font-medium leading-snug tracking-tight text-ink md:mt-8 md:text-xl">
                  {subheading}
                </h3>
              ) : null}
              {closingBlocks.map((p, i) => (
                <p
                  key={`close-${i}`}
                  className={
                    i === 0 && subheading
                      ? "mt-4 text-[15px] leading-[1.75] text-muted md:mt-5 md:text-base md:leading-[1.7]"
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
              className="pointer-events-none absolute -bottom-5 left-0 right-[18%] top-[18%] rounded-[1.75rem] bg-sage/20 md:-bottom-6 md:rounded-[2rem]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-0 right-0 h-32 w-48 translate-x-1/4 translate-y-1/4 rounded-full bg-rose/20 blur-3xl md:h-40 md:w-56"
              aria-hidden
            />
            {/* Photo is 4:3 landscape — keep this aspect on all breakpoints so nothing is cropped */}
            <figure className="relative mx-auto aspect-[4/3] w-full md:mx-0 md:translate-x-1 lg:translate-x-3">
              <div className="relative h-full w-full overflow-hidden rounded-[1.35rem] bg-ink/[0.04] shadow-[0_32px_80px_-24px_rgba(28,28,26,0.28),0_12px_32px_-16px_rgba(28,28,26,0.12)] ring-1 ring-ink/[0.06] md:rounded-[1.75rem]">
                <Image
                  src={STUDIO_PHOTO}
                  alt={sectionTitle}
                  fill
                  className="object-contain"
                  sizes="(max-width:768px) 100vw, 58vw"
                />
              </div>
            </figure>
          </div>
        </div>

        <div
          className="mx-auto mt-12 h-px max-w-md bg-gradient-to-r from-transparent via-ink/15 to-transparent md:mt-14"
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
