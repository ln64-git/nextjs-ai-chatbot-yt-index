import { tool } from "ai";
import { z } from "zod";

import { extractKeywordsFromTranscript } from "@/yt-index/utils/keywords";
import { extractSegments } from "@/yt-index/utils/segments";
import { YouTubeUrlInputSchema } from "@/yt-index/types";
import { fetchYouTubeTranscript } from "./utils/youtube";

// Helper function to execute the tool and get the result
async function executeTool(toolInstance: any, params: any) {
  const result = await toolInstance.execute(params);
  // Handle AsyncIterable result
  if (result && typeof result[Symbol.asyncIterator] === 'function') {
    const iterator = result[Symbol.asyncIterator]();
    const { value } = await iterator.next();
    return value;
  }
  return result;
}

// ============================================================================
// UNIFIED YOUTUBE PROCESSING TOOL
// ============================================================================

export const processYouTubeVideo = tool({
  description: "Process a YouTube video to extract transcript, keywords, and segments",
  inputSchema: z.object({
    url: z
      .string()
      .url()
      .describe("The YouTube video URL to process"),
    includeKeywords: z
      .boolean()
      .default(true)
      .describe("Whether to extract keywords from the transcript"),
    includeSegments: z
      .boolean()
      .default(true)
      .describe("Whether to extract segments from the transcript"),
    maxSegments: z
      .number()
      .default(15)
      .describe("Maximum number of segments to return"),
  }),
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
      const results: {
        success: boolean;
        videoId: string;
        videoTitle?: string;
        videoAuthor?: string;
        transcriptLength: number;
        transcript: string;
        summary: string;
        message: string;
        keywords: any;
        segments: string[];
        totalSegments: number;
      } = {
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
          results.keywords = await extractKeywordsFromTranscript(transcriptResult.transcript);
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

// ============================================================================
// LEGACY TOOLS (for backward compatibility)
// ============================================================================

export const fetchYouTubeVideoKeywords = tool({
  description: "Fetch and extract transcript from a YouTube video using yt-dlp (legacy)",
  inputSchema: YouTubeUrlInputSchema,
  execute: async ({ url }) => {
    const result = await executeTool(processYouTubeVideo, { 
      url, 
      includeKeywords: true, 
      includeSegments: false 
    });
    
    return {
      success: result.success,
      videoId: result.videoId,
      videoTitle: result.videoTitle,
      videoAuthor: result.videoAuthor,
      transcript: result.transcript,
      transcriptLength: result.transcriptLength,
      summary: result.summary,
      keywords: result.keywords,
      message: result.message,
    };
  },
});

export const fetchYouTubeVideoSegments = tool({
  description: "Extract transcript segments from a YouTube video using yt-dlp (legacy)",
  inputSchema: YouTubeUrlInputSchema,
  execute: async ({ url }) => {
    const result = await executeTool(processYouTubeVideo, { 
      url, 
      includeKeywords: false, 
      includeSegments: true 
    });
    
    return {
      success: result.success,
      videoId: result.videoId,
      videoTitle: result.videoTitle,
      videoAuthor: result.videoAuthor,
      transcriptLength: result.transcriptLength,
      segments: result.segments,
      totalSegments: result.totalSegments,
      message: result.message,
    };
  },
});
