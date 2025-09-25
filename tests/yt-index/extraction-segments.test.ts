import { expect, test } from "@playwright/test";

import { extractSegments } from "../../src/yt-index/utils/segments";
import { SAMPLE_TRANSCRIPTS } from "./shared/test-utils";

// ============================================================================
// SEGMENT EXTRACTION TESTS
// ============================================================================

test.describe("Extract Segments", () => {
  test("should extract segments from simple transcript", () => {
    const segments = extractSegments(SAMPLE_TRANSCRIPTS.SIMPLE);
    
    expect(segments).toBeDefined();
    expect(segments.length).toBeGreaterThan(0);
    expect(segments.every(segment => segment.length >= 10)).toBe(true);
  });

  test("should extract segments from complex transcript", () => {
    const segments = extractSegments(SAMPLE_TRANSCRIPTS.COMPLEX);
    
    expect(segments).toBeDefined();
    expect(segments.length).toBeGreaterThan(0);
    expect(segments.every(segment => segment.length >= 10)).toBe(true);
  });

  test("should handle empty transcript", () => {
    const segments = extractSegments(SAMPLE_TRANSCRIPTS.EMPTY);
    expect(segments).toEqual([]);
  });

  test("should handle single sentence", () => {
    const segments = extractSegments(SAMPLE_TRANSCRIPTS.SINGLE_SENTENCE);
    expect(segments.length).toBeGreaterThan(0);
    expect(segments[0]).toContain(".");
  });

  test("should handle multiple punctuation", () => {
    const segments = extractSegments(SAMPLE_TRANSCRIPTS.MULTIPLE_PUNCTUATION);
    expect(segments.length).toBeGreaterThan(0);
    expect(segments.every(segment => segment.length >= 10)).toBe(true);
  });
});
