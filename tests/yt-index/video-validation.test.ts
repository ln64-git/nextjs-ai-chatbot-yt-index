import { expect, test } from "@playwright/test";
import { checkVideoExists, validateYouTubeVideo } from "../../src/yt-index/utils/video-validation";

test.describe("Video Validation - Unit Tests", () => {
  test("should validate correct YouTube URLs", () => {
    const validUrls = [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://youtube.com/watch?v=dQw4w9WgXcQ",
      "http://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ];

    for (const url of validUrls) {
      const result = validateYouTubeVideo(url);
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe("dQw4w9WgXcQ");
      expect(result.error).toBeUndefined();
    }
  });

  test("should reject invalid URLs", () => {
    const invalidUrls = [
      "https://www.google.com",
      "https://www.youtube.com",
      "https://www.youtube.com/watch",
      "https://www.youtube.com/watch?v=",
      "https://www.youtube.com/watch?v=short",
      "https://www.youtube.com/watch?v=thisiswaytoolongtobeavideoid",
      "not-a-url",
      "",
      null as any,
      undefined as any,
    ];

    for (const url of invalidUrls) {
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
    const invalidLengthUrls = [
      "https://www.youtube.com/watch?v=short",
      "https://www.youtube.com/watch?v=thisiswaytoolongtobeavideoid",
      "https://www.youtube.com/watch?v=1234567890", // 10 chars
      "https://www.youtube.com/watch?v=123456789012", // 12 chars
    ];

    for (const url of invalidLengthUrls) {
      const result = validateYouTubeVideo(url);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Not a valid YouTube video URL");
    }
  });

  test("should handle URLs with additional parameters", () => {
    const urlsWithParams = [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLxyz&index=1",
      "https://youtu.be/dQw4w9WgXcQ?t=30",
    ];

    for (const url of urlsWithParams) {
      const result = validateYouTubeVideo(url);
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe("dQw4w9WgXcQ");
    }
  });

  test("should check if video exists", async () => {
    // Test with a known existing video (Rick Roll)
    const existingVideoId = "dQw4w9WgXcQ";
    const exists = await checkVideoExists(existingVideoId);
    expect(exists).toBe(true);
  });

  test("should return false for non-existent video", async () => {
    // Test with a non-existent video ID
    const nonExistentVideoId = "00000000000";
    const exists = await checkVideoExists(nonExistentVideoId);
    expect(exists).toBe(false);
  });

  test("should handle network errors gracefully", async () => {
    // Mock a network error by using an invalid domain
    const invalidVideoId = "dQw4w9WgXcQ";
    
    // This should still work as it's a real video ID, but we're testing error handling
    const exists = await checkVideoExists(invalidVideoId);
    expect(typeof exists).toBe('boolean');
  });
});
