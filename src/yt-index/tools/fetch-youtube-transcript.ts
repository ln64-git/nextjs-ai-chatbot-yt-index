import { tool } from "ai";
import { z } from "zod";
import {
  DICTIONARY_CONFIGS,
  extractKeywordsFromTranscript,
} from "../utils/keywords";
import { fetchYouTubeTranscript } from "../utils/yt-dlp";

export const fetchYouTubeVideoTranscript = tool({
  description: "Fetch and extract transcript from a YouTube video using yt-dlp",
  inputSchema: z.object({
    url: z
      .string()
      .url()
      .describe("The YouTube video URL to extract transcript from"),
  }),
  execute: async ({ url }) => {
    try {
      console.log("🎬 [TRANSCRIPT] Starting transcript extraction for:", url);

      const result = await fetchYouTubeTranscript(url);

      if (result.success) {
        // Automatically extract keywords from the transcript
        let keywords: Awaited<
          ReturnType<typeof extractKeywordsFromTranscript>
        > | null = null;
        try {
          console.log(
            "🔍 [TRANSCRIPT] Auto-extracting keywords with Google Knowledge Graph..."
          );
          keywords = await extractKeywordsFromTranscript(
            result.transcript,
            DICTIONARY_CONFIGS.comprehensive,
            ["google_knowledge"], // Only use Google Knowledge Graph
            { google_knowledge: 2.0 } // Boost knowledge graph entities
          );
          console.log(`🔍 [TRANSCRIPT] Found ${keywords.totalCount} keywords`);
        } catch (error) {
          console.warn("⚠️ [TRANSCRIPT] Keyword extraction failed:", error);
        }

        return {
          success: true,
          videoId: result.videoId,
          videoTitle: result.videoTitle,
          videoAuthor: result.videoAuthor,
          transcript: result.transcript,
          transcriptLength: result.transcriptLength,
          summary: result.summary,
          keywords,
          message: result.message,
        };
      }

      return {
        success: false,
        videoId: result.videoId || "",
        videoTitle: result.videoTitle || "",
        videoAuthor: result.videoAuthor || "",
        transcript: result.transcript,
        transcriptLength: result.transcriptLength,
        summary: result.summary,
        keywords: null,
        message: result.message,
      };
    } catch (error) {
      console.error(
        "❌ [TRANSCRIPT] Error during transcript extraction:",
        error
      );
      return {
        success: false,
        videoId: "",
        videoTitle: "",
        videoAuthor: "",
        transcript: "",
        transcriptLength: 0,
        summary: "",
        keywords: null,
        message: `❌ An error occurred while fetching the transcript: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
