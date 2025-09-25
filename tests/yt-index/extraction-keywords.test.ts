import { expect, test } from "@playwright/test";

import { extractKeywordsFromTranscript } from "../../src/yt-index/utils/keywords";
import { SAMPLE_TRANSCRIPTS } from "./shared/test-utils";

// ============================================================================
// KEYWORD EXTRACTION TESTS
// ============================================================================

test.describe("Extract Keywords", () => {
  test("should extract keywords from short transcript", async () => {
    const result = await extractKeywordsFromTranscript(SAMPLE_TRANSCRIPTS.SHORT);
    
    expect(result.keywords).toBeDefined();
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.totalCount).toBeGreaterThan(0);
    
    const keywords = result.keywords.map(k => k.word.toLowerCase());
    expect(keywords.some(k => k.includes('programming') || k.includes('development'))).toBe(true);
  });

  test("should extract technical keywords from technical transcript", async () => {
    const result = await extractKeywordsFromTranscript(SAMPLE_TRANSCRIPTS.TECHNICAL);
    
    expect(result.keywords.length).toBeGreaterThan(0);
    
    const keywords = result.keywords.map(k => k.word.toLowerCase());
    expect(keywords.some(k => k.includes('react') || k.includes('typescript'))).toBe(true);
    expect(keywords.some(k => k.includes('node') || k.includes('express'))).toBe(true);
    expect(keywords.some(k => k.includes('mongodb') || k.includes('backend'))).toBe(true);
  });

  test("should handle empty transcript", async () => {
    const result = await extractKeywordsFromTranscript(SAMPLE_TRANSCRIPTS.EMPTY);
    
    expect(result.keywords).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  test("should return keywords with scores", async () => {
    const result = await extractKeywordsFromTranscript(SAMPLE_TRANSCRIPTS.SHORT);
    
    expect(result.keywords.length).toBeGreaterThan(0);
    
    for (const keyword of result.keywords) {
      expect(keyword.score).toBeGreaterThan(0);
      expect(keyword.score).toBeLessThanOrEqual(1);
      expect(keyword.word).toBeTruthy();
      expect(keyword.entity).toBeTruthy();
    }
  });
});
