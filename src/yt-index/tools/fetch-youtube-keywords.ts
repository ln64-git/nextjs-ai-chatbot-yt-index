import { tool } from "ai";
import { z } from "zod";
import { extractKeywordsFromTranscript } from "../utils/keywords";
import { fetchYouTubeTranscript } from "../utils/yt-dlp";

export const fetchYouTubeVideoKeywords = tool({
  description: "Fetch and extract transcript from a YouTube video using yt-dlp",
  inputSchema: z.object({
    url: z
      .string()
      .url()
      .describe("The YouTube video URL to extract transcript from"),
  }),
  execute: async ({ url }) => {
    try {
      const result = await fetchYouTubeTranscript(url);

      if (result.success) {
        // Automatically extract keywords from the transcript
        let keywords: Awaited<
          ReturnType<typeof extractKeywordsFromTranscript>
        > | null = null;
        try {
          keywords = await extractKeywordsFromTranscript(result.transcript);
        } catch {
          // Keyword extraction failed
        }

        // Truncate transcript for AI model to avoid context length issues
        const maxTranscriptLength = 10_000; // 10k characters should be safe
        const isTruncated = result.transcript.length > maxTranscriptLength;
        const truncatedTranscript = isTruncated
          ? `${result.transcript.substring(0, maxTranscriptLength)}... [truncated]`
          : result.transcript;

        const message = isTruncated
          ? `${result.message} Note: Transcript was truncated to ${maxTranscriptLength.toLocaleString()} characters for AI processing. Full transcript (${result.transcriptLength.toLocaleString()} chars) was used for keyword extraction.`
          : result.message;

        return {
          success: true,
          videoId: result.videoId,
          videoTitle: result.videoTitle,
          videoAuthor: result.videoAuthor,
          transcript: truncatedTranscript,
          transcriptLength: result.transcriptLength,
          summary: result.summary,
          keywords,
          message,
        };
      }

      // Truncate transcript for AI model to avoid context length issues
      const maxTranscriptLength = 10_000; // 10k characters should be safe
      const isTruncated = result.transcript.length > maxTranscriptLength;
      const truncatedTranscript = isTruncated
        ? `${result.transcript.substring(0, maxTranscriptLength)}... [truncated]`
        : result.transcript;

      const message = isTruncated
        ? `${result.message} Note: Transcript was truncated to ${maxTranscriptLength.toLocaleString()} characters for AI processing. Full transcript (${result.transcriptLength.toLocaleString()} chars) was used for keyword extraction.`
        : result.message;

      return {
        success: false,
        videoId: result.videoId || "",
        videoTitle: result.videoTitle || "",
        videoAuthor: result.videoAuthor || "",
        transcript: truncatedTranscript,
        transcriptLength: result.transcriptLength,
        summary: result.summary,
        keywords: null,
        message,
      };
    } catch (error) {
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
