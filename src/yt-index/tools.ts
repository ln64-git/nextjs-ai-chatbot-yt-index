import { tool } from "ai";

import { extractKeywordsFromTranscript } from "@/yt-index/utils/keywords";
import { extractSegments } from "@/yt-index/utils/segments";
import { fetchYouTubeTranscript } from "./utils/youtube";
import type { ProcessYouTubeVideoResult } from "./types";
import { ProcessYouTubeVideoInputSchema } from "./types";

// ============================================================================
// UNIFIED YOUTUBE PROCESSING TOOL
// ============================================================================

export const processYouTubeVideo = tool({
  description:
    "Process a YouTube video to extract transcript, keywords, and segments",
  inputSchema: ProcessYouTubeVideoInputSchema,
  execute: async ({ url, includeKeywords, includeSegments, maxSegments }) => {
    try {
      const transcriptResult = await fetchYouTubeTranscript(url);

      if (!transcriptResult.success) {
        return {
          success: false,
          videoId: transcriptResult.videoId,
          videoTitle: transcriptResult.videoTitle,
          videoAuthor: transcriptResult.videoAuthor,
          transcriptLength: transcriptResult.transcriptLength,
          transcript: "",
          summary: "",
          keywords: null,
          segments: [],
          totalSegments: 0,
          message: transcriptResult.message,
        };
      }

      // Process transcript based on requested features
      const results: ProcessYouTubeVideoResult = {
        success: true,
        videoId: transcriptResult.videoId,
        videoTitle: transcriptResult.videoTitle,
        videoAuthor: transcriptResult.videoAuthor,
        transcriptLength: transcriptResult.transcriptLength,
        transcript: transcriptResult.transcript,
        summary: transcriptResult.summary,
        message: transcriptResult.message,
        keywords: null,
        segments: [],
        totalSegments: 0,
      };

      // Extract keywords if requested
      if (includeKeywords) {
        try {
          results.keywords = await extractKeywordsFromTranscript(
            transcriptResult.transcript
          );
        } catch {
          results.keywords = null;
          results.message += " Note: Keyword extraction failed.";
        }
      } else {
        results.keywords = null;
      }

      // Extract segments if requested
      if (includeSegments) {
        const segments = extractSegments(transcriptResult.transcript);
        results.segments = segments.slice(0, maxSegments);
        results.totalSegments = segments.length;
      } else {
        results.segments = [];
        results.totalSegments = 0;
      }

      return results;
    } catch (error) {
      return {
        success: false,
        videoId: "",
        videoTitle: "",
        videoAuthor: "",
        transcriptLength: 0,
        transcript: "",
        summary: "",
        keywords: null,
        segments: [],
        totalSegments: 0,
        message: `❌ An error occurred while processing the video: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
