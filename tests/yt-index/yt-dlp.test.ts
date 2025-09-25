import { expect, test } from "@playwright/test";
import { fetchYouTubeTranscript } from "../../src/yt-index/utils/yt-dlp";

// Known test videos with transcripts
const TEST_VIDEOS = {
  SHORT_WITH_TRANSCRIPT: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Rick Roll - has transcript
  LONG_WITH_TRANSCRIPT: "https://www.youtube.com/watch?v=IOV06O5PkAE", // Manly P Hall - has transcript
  NO_TRANSCRIPT: "https://www.youtube.com/watch?v=00000000000", // Non-existent video
  INVALID_URL: "https://www.youtube.com/watch?v=invalid123",
};

test.describe("yt-dlp Integration Tests", () => {
  test("should extract transcript from video with captions", async () => {
    const result = await fetchYouTubeTranscript(TEST_VIDEOS.SHORT_WITH_TRANSCRIPT);
    
    expect(result.success).toBe(true);
    expect(result.transcript).toBeTruthy();
    expect(result.transcript.length).toBeGreaterThan(0);
    expect(result.videoId).toBe("dQw4w9WgXcQ");
    expect(result.videoTitle).toBeTruthy();
    expect(result.videoAuthor).toBeTruthy();
    expect(result.transcriptLength).toBeGreaterThan(0);
    expect(result.summary).toBeTruthy();
  });

  test("should extract transcript from long video", async () => {
    const result = await fetchYouTubeTranscript(TEST_VIDEOS.LONG_WITH_TRANSCRIPT);
    
    expect(result.success).toBe(true);
    expect(result.transcript).toBeTruthy();
    expect(result.transcript.length).toBeGreaterThan(0);
    expect(result.videoId).toBe("IOV06O5PkAE");
    expect(result.videoTitle).toBeTruthy();
    expect(result.videoAuthor).toBeTruthy();
    expect(result.transcriptLength).toBeGreaterThan(0);
  });

  test("should handle video without transcript", async () => {
    const result = await fetchYouTubeTranscript(TEST_VIDEOS.NO_TRANSCRIPT);
    
    expect(result.success).toBe(false);
    expect(result.transcript).toBe("");
    expect(result.message).toContain("❌");
    expect(result.videoId).toBe("00000000000");
  });

  test("should handle invalid video URL", async () => {
    const result = await fetchYouTubeTranscript(TEST_VIDEOS.INVALID_URL);
    
    expect(result.success).toBe(false);
    expect(result.transcript).toBe("");
    expect(result.message).toContain("❌");
    expect(result.videoId).toBe("");
  });

  test("should return proper error for non-existent video", async () => {
    const result = await fetchYouTubeTranscript(TEST_VIDEOS.NO_TRANSCRIPT);
    
    expect(result.success).toBe(false);
    expect(result.message).toContain("Transcript Not Available");
    expect(result.videoTitle).toBe("Unknown");
    expect(result.videoAuthor).toBe("Unknown");
  });

  test("should extract video metadata correctly", async () => {
    const result = await fetchYouTubeTranscript(TEST_VIDEOS.SHORT_WITH_TRANSCRIPT);
    
    expect(result.success).toBe(true);
    expect(result.videoTitle).toBeTruthy();
    expect(result.videoAuthor).toBeTruthy();
    expect(typeof result.videoTitle).toBe('string');
    expect(typeof result.videoAuthor).toBe('string');
  });

  test("should provide meaningful summary", async () => {
    const result = await fetchYouTubeTranscript(TEST_VIDEOS.SHORT_WITH_TRANSCRIPT);
    
    expect(result.success).toBe(true);
    expect(result.summary).toBeTruthy();
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.summary.length).toBeLessThanOrEqual(result.transcript.length);
  });

  test("should handle network errors gracefully", async () => {
    // Test with a malformed URL that should cause network issues
    const result = await fetchYouTubeTranscript("https://invalid-domain.com/watch?v=test");
    
    expect(result.success).toBe(false);
    expect(result.message).toContain("❌");
  });

  test("should return consistent results for same video", async () => {
    const result1 = await fetchYouTubeTranscript(TEST_VIDEOS.SHORT_WITH_TRANSCRIPT);
    const result2 = await fetchYouTubeTranscript(TEST_VIDEOS.SHORT_WITH_TRANSCRIPT);
    
    expect(result1.success).toBe(result2.success);
    expect(result1.videoId).toBe(result2.videoId);
    expect(result1.videoTitle).toBe(result2.videoTitle);
    expect(result1.videoAuthor).toBe(result2.videoAuthor);
  });
});
