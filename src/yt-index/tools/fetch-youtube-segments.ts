import { tool } from "ai";
import { z } from "zod";
import { fetchYouTubeTranscript } from "../utils/yt-dlp";
import { extractSegments } from "../utils/segments";

export const fetchYouTubeVideoSegments = tool({
  description: "Extract transcript segments from a YouTube video using yt-dlp",
  inputSchema: z.object({
    url: z
      .string()
      .url()
      .describe("The YouTube video URL to extract transcript segments from"),
  }),
  execute: async ({ url }) => {
    try {
      const result = await fetchYouTubeTranscript(url);

      if (result.success) {
        // Extract segments from the transcript
        const segments = extractSegments(result.transcript);

        console.log(
          `🔍 [SEGMENTS] Extracted ${segments.length} segments from transcript`
        );

        return {
          success: true,
          videoId: result.videoId,
          videoTitle: result.videoTitle,
          videoAuthor: result.videoAuthor,
          transcriptLength: result.transcriptLength,
          segments: segments.slice(0, 15), // Return first 15 segments
          totalSegments: segments.length,
          message: `Successfully extracted ${segments.length} segments from the transcript`,
        };
      }

      return {
        success: false,
        videoId: result.videoId || "",
        videoTitle: result.videoTitle || "",
        videoAuthor: result.videoAuthor || "",
        transcriptLength: result.transcriptLength,
        segments: [],
        totalSegments: 0,
        message: result.message,
      };
    } catch (error) {
      console.error("❌ [SEGMENTS] Error during segment extraction:", error);
      return {
        success: false,
        videoId: "",
        videoTitle: "",
        videoAuthor: "",
        transcriptLength: 0,
        segments: [],
        totalSegments: 0,
        message: `❌ An error occurred while extracting segments: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
