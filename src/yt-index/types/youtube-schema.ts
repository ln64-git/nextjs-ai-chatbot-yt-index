import { z } from "zod";

export const YouTubeVideoSchema = z.object({
  title: z.string(),
  publishedAt: z.string(),
  viewCount: z.number(),
  videoId: z.string(),
  url: z.string(),
  duration: z.number().optional(),
  description: z.string().optional(),
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
  results: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        uploader: z.string(),
        duration: z.number(),
        viewCount: z.number(),
        uploadDate: z.string(),
        description: z.string(),
        thumbnail: z.string(),
      })
    )
    .optional(),
  message: z.string(),
  error: z.string().optional(),
});

export type YouTubeVideo = z.infer<typeof YouTubeVideoSchema>;
export type YouTubeChannelIndexResult = z.infer<
  typeof YouTubeChannelIndexResultSchema
>;
export type YouTubeTranscriptResult = z.infer<
  typeof YouTubeTranscriptResultSchema
>;
export type YouTubeSearchResult = z.infer<typeof YouTubeSearchResultSchema>;
