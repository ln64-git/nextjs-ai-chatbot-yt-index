import { expect, test } from "@playwright/test";
import { fetchYouTubeVideoKeywords } from "../../src/yt-index/tools/fetch-youtube-keywords";
import { fetchYouTubeVideoSegments } from "../../src/yt-index/tools/fetch-youtube-segments";

// Helper function to handle AI tool execution
async function executeTool(tool: any, params: any): Promise<any> {
  const result = await tool.execute(params);
  if (result && typeof result[Symbol.asyncIterator] === "function") {
    const results: any[] = [];
    for await (const chunk of result) {
      results.push(chunk);
    }
    return results.at(-1) || results[0];
  }
  return result;
}

// Test videos with known content
const TEST_VIDEOS = {
  SHORT: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Rick Roll
  LONG: "https://www.youtube.com/watch?v=W6NZfCO5SIk", // JavaScript Tutorial for Beginners
  INVALID: "https://www.youtube.com/watch?v=invalid123",
  NON_EXISTENT: "https://www.youtube.com/watch?v=00000000000",
};

test.describe("YouTube Tools - Integration Tests", () => {
  test("should extract keywords and segments from same video", async () => {
    const keywordsResult = await executeTool(fetchYouTubeVideoKeywords, {
      url: TEST_VIDEOS.SHORT,
    });

    const segmentsResult = await executeTool(fetchYouTubeVideoSegments, {
      url: TEST_VIDEOS.SHORT,
    });

    // Both should succeed
    expect(keywordsResult.success).toBe(true);
    expect(segmentsResult.success).toBe(true);

    // Should have same video metadata
    expect(keywordsResult.videoId).toBe(segmentsResult.videoId);
    expect(keywordsResult.videoTitle).toBe(segmentsResult.videoTitle);
    expect(keywordsResult.videoAuthor).toBe(segmentsResult.videoAuthor);

    // Should have extracted data
    expect(keywordsResult.keywords).toBeDefined();
    expect(keywordsResult.keywords.totalCount).toBeGreaterThan(0);
    expect(segmentsResult.segments).toBeDefined();
    expect(segmentsResult.totalSegments).toBeGreaterThan(0);

    // Keywords should be relevant to the video content
    const keywordWords = keywordsResult.keywords.keywords.map((k: any) => k.word.toLowerCase());
    expect(keywordWords.length).toBeGreaterThan(0);

    // Segments should be meaningful
    expect(segmentsResult.segments.length).toBeGreaterThan(0);
    for (const segment of segmentsResult.segments) {
      expect(segment.length).toBeGreaterThan(10);
    };
  });

  test("should handle long video with both tools", async () => {
    const keywordsResult = await executeTool(fetchYouTubeVideoKeywords, {
      url: TEST_VIDEOS.LONG,
    });

    const segmentsResult = await executeTool(fetchYouTubeVideoSegments, {
      url: TEST_VIDEOS.LONG,
    });

    // Both should succeed
    expect(keywordsResult.success).toBe(true);
    expect(segmentsResult.success).toBe(true);

    // Should have same video metadata
    expect(keywordsResult.videoId).toBe(segmentsResult.videoId);
    expect(keywordsResult.videoTitle).toBe(segmentsResult.videoTitle);

    // Should have some content for longer video (adjust expectations based on actual availability)
    expect(keywordsResult.transcriptLength).toBeGreaterThan(100);
    expect(segmentsResult.totalSegments).toBeGreaterThan(1);
  });

  test("should handle invalid URL consistently", async () => {
    const keywordsResult = await executeTool(fetchYouTubeVideoKeywords, {
      url: TEST_VIDEOS.INVALID,
    });

    const segmentsResult = await executeTool(fetchYouTubeVideoSegments, {
      url: TEST_VIDEOS.INVALID,
    });

    // Both should fail
    expect(keywordsResult.success).toBe(false);
    expect(segmentsResult.success).toBe(false);

    // Should have consistent error handling
    expect(keywordsResult.message).toContain("❌");
    expect(segmentsResult.message).toContain("❌");
  });

  test("should handle non-existent video consistently", async () => {
    const keywordsResult = await executeTool(fetchYouTubeVideoKeywords, {
      url: TEST_VIDEOS.NON_EXISTENT,
    });

    const segmentsResult = await executeTool(fetchYouTubeVideoSegments, {
      url: TEST_VIDEOS.NON_EXISTENT,
    });

    // Both should fail
    expect(keywordsResult.success).toBe(false);
    expect(segmentsResult.success).toBe(false);

    // Should have consistent error messages
    expect(keywordsResult.message).toContain("❌");
    expect(segmentsResult.message).toContain("❌");
  });

  test("should provide consistent video metadata", async () => {
    const keywordsResult = await executeTool(fetchYouTubeVideoKeywords, {
      url: TEST_VIDEOS.SHORT,
    });

    const segmentsResult = await executeTool(fetchYouTubeVideoSegments, {
      url: TEST_VIDEOS.SHORT,
    });

    // Video metadata should be identical
    expect(keywordsResult.videoId).toBe(segmentsResult.videoId);
    expect(keywordsResult.videoTitle).toBe(segmentsResult.videoTitle);
    expect(keywordsResult.videoAuthor).toBe(segmentsResult.videoAuthor);
    expect(keywordsResult.transcriptLength).toBe(segmentsResult.transcriptLength);
  });

  test("should handle concurrent requests", async () => {
    // Run both tools concurrently
    const [keywordsResult, segmentsResult] = await Promise.all([
      executeTool(fetchYouTubeVideoKeywords, { url: TEST_VIDEOS.SHORT }),
      executeTool(fetchYouTubeVideoSegments, { url: TEST_VIDEOS.SHORT }),
    ]);

    // Both should succeed
    expect(keywordsResult.success).toBe(true);
    expect(segmentsResult.success).toBe(true);

    // Should have same video metadata
    expect(keywordsResult.videoId).toBe(segmentsResult.videoId);
  });

  test("should validate keyword extraction quality", async () => {
    const result = await executeTool(fetchYouTubeVideoKeywords, {
      url: TEST_VIDEOS.SHORT,
    });

    expect(result.success).toBe(true);
    expect(result.keywords).toBeDefined();
    expect(result.keywords.keywords.length).toBeGreaterThan(0);

    // Keywords should have proper structure
    for (const keyword of result.keywords.keywords) {
      expect(keyword.word).toBeTruthy();
      expect(keyword.entity).toBeTruthy();
      expect(keyword.score).toBeGreaterThan(0);
      expect(keyword.score).toBeLessThanOrEqual(1);
    };

    // Should have grouped keywords
    expect(result.keywords.groupedKeywords).toBeDefined();
    expect(typeof result.keywords.groupedKeywords).toBe('object');
  });

  test("should validate segment extraction quality", async () => {
    const result = await executeTool(fetchYouTubeVideoSegments, {
      url: TEST_VIDEOS.SHORT,
    });

    expect(result.success).toBe(true);
    expect(result.segments).toBeDefined();
    expect(result.segments.length).toBeGreaterThan(0);

    // Segments should be meaningful
    for (const segment of result.segments) {
      expect(segment.length).toBeGreaterThan(10);
      expect(segment.trim()).toBeTruthy();
    };

    // Should have proper count
    expect(result.totalSegments).toBe(result.segments.length);
  });
});
