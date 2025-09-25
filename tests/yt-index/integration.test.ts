import { expect, test } from "@playwright/test";

import { processYouTubeVideo } from "../../src/yt-index/tools";
import { executeTool, TEST_VIDEOS } from "./shared/test-utils";

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

test.describe("YouTube Tools - Integration Tests", () => {
  test("should process video with both keywords and segments", async () => {
    const result = await executeTool(processYouTubeVideo, {
      url: TEST_VIDEOS.SHORT_WITH_TRANSCRIPT,
      includeKeywords: true,
      includeSegments: true,
      maxSegments: 10,
    });

    expect(result.success).toBe(true);
    expect(result.videoId).toBe("dQw4w9WgXcQ");
    expect(result.videoTitle).toBeTruthy();
    expect(result.videoAuthor).toBeTruthy();
    expect(result.transcript).toBeTruthy();
    expect(result.keywords).toBeDefined();
    expect(result.segments).toBeDefined();
    expect(result.segments.length).toBeGreaterThan(0);
    expect(result.totalSegments).toBeGreaterThan(0);
  });

  test("should process video with only keywords", async () => {
    const result = await executeTool(processYouTubeVideo, {
      url: TEST_VIDEOS.SHORT_WITH_TRANSCRIPT,
      includeKeywords: true,
      includeSegments: false,
    });

    expect(result.success).toBe(true);
    expect(result.keywords).toBeDefined();
    expect(result.segments).toEqual([]);
    expect(result.totalSegments).toBe(0);
  });

  test("should process video with only segments", async () => {
    const result = await executeTool(processYouTubeVideo, {
      url: TEST_VIDEOS.SHORT_WITH_TRANSCRIPT,
      includeKeywords: false,
      includeSegments: true,
    });

    expect(result.success).toBe(true);
    expect(result.keywords).toBeNull();
    expect(result.segments).toBeDefined();
    expect(result.segments.length).toBeGreaterThan(0);
  });

  test("should handle video without transcript", async () => {
    const result = await executeTool(processYouTubeVideo, {
      url: TEST_VIDEOS.NO_TRANSCRIPT,
      includeKeywords: true,
      includeSegments: true,
    });

    expect(result.success).toBe(false);
    expect(result.transcript).toBe("");
    expect(result.keywords).toBeNull();
    expect(result.segments).toEqual([]);
  });

  test("should respect maxSegments parameter", async () => {
    const result = await executeTool(processYouTubeVideo, {
      url: TEST_VIDEOS.SHORT_WITH_TRANSCRIPT,
      includeKeywords: false,
      includeSegments: true,
      maxSegments: 5,
    });

    expect(result.success).toBe(true);
    expect(result.segments.length).toBeLessThanOrEqual(5);
  });
});
