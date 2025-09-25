import { expect, test } from "@playwright/test";
import { fetchYouTubeVideoKeywords } from "../../src/yt-index/tools/fetch-youtube-keywords";
import { fetchYouTubeVideoSegments } from "../../src/yt-index/tools/fetch-youtube-segments";

// Test URLs
const TEST_VIDEOS = {
  SHORT: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Rick Roll
  LONG: "https://www.youtube.com/watch?v=IOV06O5PkAE", // Many P Hall
  INVALID: "https://www.youtube.com/watch?v=invalid123",
  NON_EXISTENT: "https://www.youtube.com/watch?v=00000000000",
} as const;

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

test.describe("YouTube Tools", () => {
  test("keywords - valid video", async () => {
    const result = await executeTool(fetchYouTubeVideoKeywords, {
      url: TEST_VIDEOS.SHORT,
    });

    expect(result.success).toBe(true);
    expect(result.videoId).toBeTruthy();
    expect(result.transcriptLength).toBeGreaterThan(0);
  });

  test("keywords - long video", async () => {
    const result = await executeTool(fetchYouTubeVideoKeywords, {
      url: TEST_VIDEOS.LONG,
    });

    expect(result.success).toBe(true);
    expect(result.transcriptLength).toBeGreaterThan(0);
  });

  test("keywords - invalid URL", async () => {
    const result = await executeTool(fetchYouTubeVideoKeywords, {
      url: TEST_VIDEOS.INVALID,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("❌");
  });

  test("keywords - non-existent video", async () => {
    const result = await executeTool(fetchYouTubeVideoKeywords, {
      url: TEST_VIDEOS.NON_EXISTENT,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("❌");
  });

  test("segments - valid video", async () => {
    const result = await executeTool(fetchYouTubeVideoSegments, {
      url: TEST_VIDEOS.SHORT,
    });

    expect(result.success).toBe(true);
    expect(result.videoId).toBeTruthy();
    expect(result.totalSegments).toBeGreaterThan(0);
    expect(Array.isArray(result.segments)).toBe(true);
  });

  test("segments - long video", async () => {
    const result = await executeTool(fetchYouTubeVideoSegments, {
      url: TEST_VIDEOS.LONG,
    });

    expect(result.success).toBe(true);
    expect(result.totalSegments).toBeGreaterThanOrEqual(0);
  });

  test("segments - invalid URL", async () => {
    const result = await executeTool(fetchYouTubeVideoSegments, {
      url: TEST_VIDEOS.INVALID,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("❌");
    expect(result.totalSegments).toBe(0);
  });

  test("segments - non-existent video", async () => {
    const result = await executeTool(fetchYouTubeVideoSegments, {
      url: TEST_VIDEOS.NON_EXISTENT,
    });

    expect(result.success).toBe(false);
    expect(result.totalSegments).toBe(0);
  });

  test("integration - both tools", async () => {
    const keywordsResult = await executeTool(fetchYouTubeVideoKeywords, {
      url: TEST_VIDEOS.SHORT,
    });

    const segmentsResult = await executeTool(fetchYouTubeVideoSegments, {
      url: TEST_VIDEOS.SHORT,
    });

    expect(keywordsResult.success).toBe(true);
    expect(segmentsResult.success).toBe(true);
    expect(keywordsResult.videoId).toBe(segmentsResult.videoId);
  });
});
