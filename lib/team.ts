export type TeamMemberId = "tanya" | "zhenya" | "yana";

export type TeamMemberConfig = {
  id: TeamMemberId;
  /** e.g. "/images/team/tanya.jpg" — files live in `public/images/team/` */
  photoSrc: string | null;
};

export const TEAM_MEMBERS: TeamMemberConfig[] = [
  { id: "tanya", photoSrc: null },
  { id: "zhenya", photoSrc: null },
  { id: "yana", photoSrc: null },
];
