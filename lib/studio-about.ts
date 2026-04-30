/** Known subheading between intro and closing copy (must match DB / translations). */
const SUBHEADING_UK = "Хто і кому дарує наші букети?";

function normalizeForMatch(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .trim()
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .replace(/—/g, "-")
    .replace(/–/g, "-");
}

export function paragraphBlocksFromAboutText(aboutText: string): string[] {
  return aboutText
    .split(/\n\n+/)
    .map((block) => block.replace(/\r\n/g, "\n").trim())
    .filter(Boolean);
}

function flattenBlock(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/\n/g, " ").trim();
}

export function splitStudioAbout(aboutText: string): {
  introBlocks: string[];
  subheading: string | null;
  closingBlocks: string[];
} {
  const needle = normalizeForMatch(SUBHEADING_UK);
  const rawBlocks = paragraphBlocksFromAboutText(aboutText);
  const idx = rawBlocks.findIndex((b) => normalizeForMatch(b) === needle);

  if (idx === -1) {
    return {
      introBlocks: rawBlocks.map(flattenBlock),
      subheading: null,
      closingBlocks: [],
    };
  }

  return {
    introBlocks: rawBlocks.slice(0, idx).map(flattenBlock),
    subheading: flattenBlock(rawBlocks[idx]),
    closingBlocks: rawBlocks.slice(idx + 1).map(flattenBlock),
  };
}
