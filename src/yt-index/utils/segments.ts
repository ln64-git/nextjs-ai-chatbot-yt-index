import { REGEX_PATTERNS } from "./constants";

// ============================================================================
// SEGMENT EXTRACTION FUNCTIONS
// ============================================================================

export function extractSegments(transcript: string): string[] {
  if (!transcript || transcript.trim().length === 0) {
    return [];
  }

  const segmentDelimiters = [".", "!", "?", ";", ":", "\n", "—", "–", "…"];
  const delimiterPattern = new RegExp(
    `[${segmentDelimiters.map((d) => d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("")}]+`,
    "g"
  );

  const segments = transcript
    .split(delimiterPattern)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  const commaSegments: string[] = [];
  for (const segment of segments) {
    if (segment.length > 100) {
      const commaSplit = segment
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      commaSegments.push(...commaSplit);
    } else {
      commaSegments.push(segment);
    }
  }

  return commaSegments
    .map((segment) => segment.replace(REGEX_PATTERNS.WHITESPACE, " ").trim())
    .filter((segment) => segment.length >= 10 && !REGEX_PATTERNS.PUNCTUATION_ONLY.test(segment))
    .map((segment) => {
      if (!REGEX_PATTERNS.SENTENCE_END.test(segment)) {
        return `${segment}.`;
      }
      return segment;
    });
}
