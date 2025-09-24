import { tool } from "ai";
import { z } from "zod";

const VIDEO_ID_REGEX =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;

type VideoMetadata = {
  title: string;
  author_name: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  html?: string;
};

export const fetchYouTubeVideo = tool({
  description:
    "Fetch YouTube video metadata including title, author, and other details",
  inputSchema: z.object({
    url: z
      .string()
      .url()
      .describe("The YouTube video URL to fetch metadata for"),
  }),
  execute: async ({ url }) => {
    try {
      console.log("🎥 [VIDEO] Starting video metadata extraction for:", url);

      // Extract video ID
      const videoId = extractVideoId(url);
      if (!videoId) {
        return {
          success: false,
          videoId: "",
          title: "",
          author: "",
          thumbnail: "",
          message: "❌ Could not extract video ID from the provided URL.",
        };
      }

      console.log("🔍 [VIDEO] Extracted video ID:", videoId);

      // Get video metadata using YouTube oEmbed API
      const metadata = await getVideoMetadata(videoId);

      if (metadata.title === "Unknown") {
        return {
          success: false,
          videoId,
          title: "",
          author: "",
          thumbnail: "",
          message:
            "❌ Could not fetch video metadata. The video may be private or unavailable.",
        };
      }

      console.log(
        `📊 [VIDEO] Video: ${metadata.title} by ${metadata.author_name}`
      );

      return {
        success: true,
        videoId,
        title: metadata.title,
        author: metadata.author_name,
        thumbnail:
          metadata.thumbnail_url ||
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        width: metadata.width,
        height: metadata.height,
        message: `✅ Successfully fetched video metadata for "${metadata.title}" by ${metadata.author_name}`,
      };
    } catch (error) {
      console.error(
        "❌ [VIDEO] Error during video metadata extraction:",
        error
      );
      return {
        success: false,
        videoId: "",
        title: "",
        author: "",
        thumbnail: "",
        message: `❌ An error occurred while fetching video metadata: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

function extractVideoId(url: string): string | null {
  const match = url.match(VIDEO_ID_REGEX);
  return match?.[1] || null;
}

async function getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (response.ok) {
      return (await response.json()) as VideoMetadata;
    }
  } catch (error) {
    console.error("Error fetching metadata:", error);
  }
  return { title: "Unknown", author_name: "Unknown" };
}
