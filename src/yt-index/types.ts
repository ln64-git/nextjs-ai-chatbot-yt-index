import { z } from "zod";

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const VideoMetadataSchema = z.object({
  title: z.string(),
  author_name: z.string(),
});

export const BaseResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  videoId: z.string(),
  videoTitle: z.string().optional(),
  videoAuthor: z.string().optional(),
  transcriptLength: z.number(),
});

// ============================================================================
// YOUTUBE VIDEO SCHEMAS
// ============================================================================

export const YouTubeVideoSchema = z.object({
  title: z.string(),
  publishedAt: z.string(),
  viewCount: z.number(),
  videoId: z.string(),
  url: z.string(),
  duration: z.number().optional(),
  description: z.string().optional(),
});

export const YouTubeSearchVideoSchema = z.object({
  title: z.string(),
  url: z.string(),
  uploader: z.string(),
  duration: z.number(),
  viewCount: z.number(),
  uploadDate: z.string(),
  description: z.string(),
  thumbnail: z.string(),
});

export const YouTubeChannelIndexResultSchema = z.object({
  success: z.boolean(),
  channelTitle: z.string().optional(),
  channelId: z.string().optional(),
  totalVideosFound: z.number().optional(),
  videos: z.array(YouTubeVideoSchema).optional(),
  mostRecentVideoTranscript: z.string().optional(),
  message: z.string(),
  error: z.string().optional(),
});

export const YouTubeTranscriptResultSchema = z.object({
  success: z.boolean(),
  videoUrl: z.string().optional(),
  language: z.string().optional(),
  transcript: z.string().optional(),
  message: z.string(),
  error: z.string().optional(),
});

export const YouTubeSearchResultSchema = z.object({
  success: z.boolean(),
  query: z.string().optional(),
  type: z.string().optional(),
  totalResults: z.number().optional(),
  results: z.array(YouTubeSearchVideoSchema).optional(),
  message: z.string(),
  error: z.string().optional(),
});

// ============================================================================
// TRANSCRIPT & KEYWORD SCHEMAS
// ============================================================================

export const TranscriptResultSchema = BaseResultSchema.extend({
  transcript: z.string(),
  summary: z.string(),
});

export const KeywordSchema = z.object({
  word: z.string(),
  entity: z.string(),
  score: z.number(),
  sources: z.array(z.string()).optional(),
});

export const KeywordExtractionResultSchema = z.object({
  keywords: z.array(KeywordSchema),
  groupedKeywords: z.record(z.array(KeywordSchema)),
  totalCount: z.number(),
  dictionariesUsed: z.array(z.string()),
});

export const SegmentResultSchema = BaseResultSchema.extend({
  segments: z.array(z.string()),
  totalSegments: z.number(),
});

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const VideoValidationResultSchema = z.object({
  isValid: z.boolean(),
  videoId: z.string().nullable(),
  error: z.string().optional(),
});

// ============================================================================
// TOOL INPUT SCHEMAS
// ============================================================================

export const YouTubeUrlInputSchema = z.object({
  url: z.string().url().describe("The YouTube video URL to process"),
});

export const ProcessYouTubeVideoInputSchema = z.object({
  url: z.string().url().describe("The YouTube video URL to process"),
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
});

// ============================================================================
// PROCESSING RESULT SCHEMAS
// ============================================================================

export const ProcessYouTubeVideoResultSchema = z.object({
  success: z.boolean(),
  videoId: z.string(),
  videoTitle: z.string().optional(),
  videoAuthor: z.string().optional(),
  transcriptLength: z.number(),
  transcript: z.string(),
  summary: z.string(),
  message: z.string(),
  keywords: z.any().nullable(),
  segments: z.array(z.string()),
  totalSegments: z.number(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type VideoMetadata = z.infer<typeof VideoMetadataSchema>;
export type BaseResult = z.infer<typeof BaseResultSchema>;
export type YouTubeVideo = z.infer<typeof YouTubeVideoSchema>;
export type YouTubeSearchVideo = z.infer<typeof YouTubeSearchVideoSchema>;
export type YouTubeChannelIndexResult = z.infer<
  typeof YouTubeChannelIndexResultSchema
>;
export type YouTubeTranscriptResult = z.infer<
  typeof YouTubeTranscriptResultSchema
>;
export type YouTubeSearchResult = z.infer<typeof YouTubeSearchResultSchema>;
export type YouTubeUrlInput = z.infer<typeof YouTubeUrlInputSchema>;
export type ProcessYouTubeVideoInput = z.infer<
  typeof ProcessYouTubeVideoInputSchema
>;
export type ProcessYouTubeVideoResult = z.infer<
  typeof ProcessYouTubeVideoResultSchema
>;

export type TranscriptResult = z.infer<typeof TranscriptResultSchema>;
export type Keyword = z.infer<typeof KeywordSchema>;
export type KeywordExtractionResult = z.infer<
  typeof KeywordExtractionResultSchema
>;
export type SegmentResult = z.infer<typeof SegmentResultSchema>;
export type VideoValidationResult = z.infer<typeof VideoValidationResultSchema>;
