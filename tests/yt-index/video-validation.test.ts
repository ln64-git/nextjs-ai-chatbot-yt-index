import { expect, test } from "@playwright/test";

import { validateYouTubeVideo } from "../../src/yt-index/utils/youtube";
import { TEST_VIDEOS } from "./shared/test-utils";

// ============================================================================
// VIDEO VALIDATION TESTS
// ============================================================================

test.describe("Video Validation", () => {
  test("should validate correct YouTube URLs", () => {
    for (const url of TEST_VIDEOS.VALID_URLS) {
      const result = validateYouTubeVideo(url);
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe("dQw4w9WgXcQ");
      expect(result.error).toBeUndefined();
    }
  });

  test("should reject invalid URLs", () => {
    for (const url of TEST_VIDEOS.INVALID_URLS) {
      const result = validateYouTubeVideo(url);
      expect(result.isValid).toBe(false);
      expect(result.videoId).toBeNull();
      expect(result.error).toBeDefined();
    }
  });

  test("should extract video ID correctly", () => {
    const testCases = [
      { url: "https://www.youtube.com/watch?v=abc123def45", expectedId: "abc123def45" },
      { url: "https://youtu.be/xyz789uvw01", expectedId: "xyz789uvw01" },
      { url: "https://www.youtube.com/embed/mno234pqr67", expectedId: "mno234pqr67" },
    ];

    for (const { url, expectedId } of testCases) {
      const result = validateYouTubeVideo(url);
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe(expectedId);
    }
  });

  test("should validate video ID length", () => {
    const result = validateYouTubeVideo("https://www.youtube.com/watch?v=short");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("invalid video ID format");
  });
});
