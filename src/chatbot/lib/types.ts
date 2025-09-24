import type { InferUITool, UIMessage } from "ai";
import { z } from "zod";
import type { ArtifactKind } from "@/components/artifact";
import type { extractVideoKeywords } from "@/yt-index/tools/extract-video-keywords";
import type { fetchYouTubeVideoTranscript } from "@/yt-index/tools/fetch-youtube-video-transcript";
import type { indexYouTubeChannel } from "@/yt-index/tools/index-youtube-channel";
import type { searchYouTubeContent } from "@/yt-index/tools/search-youtube-content";
import type { createDocument } from "./ai/tools/create-document";
import type { getWeather } from "./ai/tools/get-weather";
import type { requestSuggestions } from "./ai/tools/request-suggestions";
import type { updateDocument } from "./ai/tools/update-document";
import type { Suggestion } from "./db/schema";
import type { AppUsage } from "./usage";

export type DataPart = { type: "append-message"; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type weatherTool = InferUITool<typeof getWeather>;
type createDocumentTool = InferUITool<ReturnType<typeof createDocument>>;
type updateDocumentTool = InferUITool<ReturnType<typeof updateDocument>>;
type requestSuggestionsTool = InferUITool<
  ReturnType<typeof requestSuggestions>
>;
type indexYouTubeChannelTool = InferUITool<
  ReturnType<typeof indexYouTubeChannel>
>;
type fetchYouTubeVideoTranscriptTool = InferUITool<
  ReturnType<typeof fetchYouTubeVideoTranscript>
>;

type searchYouTubeContentTool = InferUITool<
  ReturnType<typeof searchYouTubeContent>
>;
type extractVideoKeywordsTool = InferUITool<
  ReturnType<typeof extractVideoKeywords>
>;

export type ChatTools = {
  getWeather: weatherTool;
  createDocument: createDocumentTool;
  updateDocument: updateDocumentTool;
  requestSuggestions: requestSuggestionsTool;
  indexYouTubeChannel: indexYouTubeChannelTool;
  fetchYouTubeVideoTranscript: fetchYouTubeVideoTranscriptTool;
  extractVideoKeywords: extractVideoKeywordsTool;
  searchYouTubeContent: searchYouTubeContentTool;
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  suggestion: Suggestion;
  appendMessage: string;
  id: string;
  title: string;
  kind: ArtifactKind;
  clear: null;
  finish: null;
  usage: AppUsage;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  CustomUIDataTypes,
  ChatTools
>;

export type Attachment = {
  name: string;
  url: string;
  contentType: string;
};
