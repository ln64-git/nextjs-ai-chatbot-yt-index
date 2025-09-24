

// Regex patterns defined at top level for performance
const WHITESPACE_REGEX = /\s+/g;
const PUNCTUATION_ONLY_REGEX = /^[^\w\s]*$/;
const SENTENCE_END_REGEX = /[.!?]$/;

// Extract segments from transcript text
export function extractSegments(transcript: string): string[] {
  if (!transcript || transcript.trim().length === 0) {
    return [];
  }

  // Split by various punctuation marks that typically indicate sentence/segment boundaries
  const segmentDelimiters = [
    ".",
    "!",
    "?", // Sentence endings
    ";",
    ":", // Strong pauses
    "\n", // Line breaks
    "—",
    "–", // Dashes
    "…", // Ellipsis
  ];

  // Create a regex pattern that matches any of the delimiters
  const delimiterPattern = new RegExp(
    `[${segmentDelimiters.map((d) => d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("")}]+`,
    "g"
  );

  // Split the transcript by delimiters
  const segments = transcript
    .split(delimiterPattern)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  // Further split by commas for more granular segments
  const commaSegments: string[] = [];
  for (const segment of segments) {
    if (segment.length > 100) {
      // Only split longer segments by commas
      const commaSplit = segment
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      commaSegments.push(...commaSplit);
    } else {
      commaSegments.push(segment);
    }
  }

  // Clean up and filter segments
  const cleanedSegments = commaSegments
    .map((segment) => {
      // Remove extra whitespace and normalize
      return segment.replace(WHITESPACE_REGEX, " ").trim();
    })
    .filter((segment) => {
      // Filter out very short segments or segments that are just punctuation
      return segment.length >= 10 && !PUNCTUATION_ONLY_REGEX.test(segment); // Not just punctuation
    })
    .map((segment) => {
      // Ensure segments end with proper punctuation if they don't already
      if (!SENTENCE_END_REGEX.test(segment)) {
        return `${segment}.`;
      }
      return segment;
    });

  return cleanedSegments;
}
