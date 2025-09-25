import { expect, test } from "@playwright/test";

import { fetchYouTubeTranscript } from "../../src/yt-index/utils/youtube";
import { TEST_VIDEOS } from "./shared/test-utils";

// ============================================================================
// TRANSCRIPT PROCESSING TESTS
// ============================================================================

test.describe("Transcript Processing", () => {
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
  });
});
