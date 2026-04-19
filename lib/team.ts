export type TeamMemberId = "tanya" | "zhenya" | "yana";

export type TeamMemberConfig = {
  id: TeamMemberId;
  /** e.g. "/images/team/tanya.jpg" — files live in `public/images/team/` */
  photoSrc: string | null;
};

export const TEAM_MEMBERS: TeamMemberConfig[] = [
  { id: "tanya", photoSrc: "/images/team/tanya.jpg" },
  { id: "zhenya", photoSrc: "/images/team/zhenya.jpg" },
  { id: "yana", photoSrc: "/images/team/yana.jpg" },
];
