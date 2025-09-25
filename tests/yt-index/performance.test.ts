import { expect, test } from "@playwright/test";

import { extractKeywordsFromTranscript } from "../../src/yt-index/utils/keywords";
import { extractSegments } from "../../src/yt-index/utils/segments";
import { SAMPLE_TRANSCRIPTS } from "./shared/test-utils";

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

test.describe("Performance Tests", () => {
  test("should handle very long transcripts", async () => {
    const longTranscript = SAMPLE_TRANSCRIPTS.LONG.repeat(100);
    
    const result = await extractKeywordsFromTranscript(longTranscript);
    
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.totalCount).toBeGreaterThan(0);
  });

  test("should handle long transcript segments", () => {
    const longTranscript = SAMPLE_TRANSCRIPTS.LONG.repeat(50);
    
    const segments = extractSegments(longTranscript);
    
    expect(segments.length).toBeGreaterThan(0);
    expect(segments.every(segment => segment.length >= 10)).toBe(true);
  });
});
