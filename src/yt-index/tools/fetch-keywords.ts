import { tool } from "ai";
import { z } from "zod";
import { extractKeywordsFromTranscript, logKeywords } from "../utils/keywords";

export const fetchKeywords = tool({
  description:
    "Extract keywords and entities from a YouTube video transcript using Named Entity Recognition (NER)",
  inputSchema: z.object({
    transcript: z
      .string()
      .describe("The transcript text to analyze for keywords and entities"),
  }),
  execute: async ({ transcript }) => {
    try {
      console.log("🔍 [KEYWORDS] Starting keyword extraction...");

      const result = await extractKeywordsFromTranscript(transcript);

      // Log the results for debugging
      logKeywords(result);

      return {
        success: true,
        totalKeywords: result.totalCount,
        keywords: result.keywords,
        groupedKeywords: result.groupedKeywords,
        message: `✅ Successfully extracted ${result.totalCount} keywords from the transcript. Found ${Object.keys(result.groupedKeywords).length} different entity types.`,
      };
    } catch (error) {
      console.error("❌ [KEYWORDS] Error during keyword extraction:", error);
      return {
        success: false,
        totalKeywords: 0,
        keywords: [],
        groupedKeywords: {},
        message: `❌ Failed to extract keywords: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
