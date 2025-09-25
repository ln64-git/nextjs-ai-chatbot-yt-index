import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// Regex patterns for subtitle parsing
const SRT_NUMBER_REGEX = /^\d+$/;
const VTT_TIMESTAMP_REGEX = /<[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}><c>/g;
const VTT_CLOSE_TAG_REGEX = /<\/c>/g;
const HTML_TAG_REGEX = /<[^>]*>/g;
const TIMESTAMP_REGEX = /[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}/g;
const VIDEO_ID_REGEX =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;

type VideoMetadata = {
  title: string;
  author_name: string;
};

// No local caching - use database for persistence

// Core function for fetching YouTube transcripts
export async function fetchYouTubeTranscript(url: string) {
  try {
    // Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      return {
        success: false,
        message: "❌ Could not extract video ID from the provided URL.",
        transcript: "",
        videoId: "",
        transcriptLength: 0,
        summary: "",
      };
    }

    // Get video metadata
    const metadata = await getVideoMetadata(videoId);

    const transcript = await extractTranscriptViaYtDlp(videoId);
    if (!transcript) {
      return {
        success: false,
        message: `❌ **Transcript Not Available**\n\n**Video:** ${metadata.title}\n**Author:** ${metadata.author_name}\n\nThis video may not have captions available, or they may be restricted.`,
        transcript: "",
        videoId,
        videoTitle: metadata.title,
        videoAuthor: metadata.author_name,
        transcriptLength: 0,
        summary: "",
      };
    }

    // Transcript will be stored in database by the calling tools

    return {
      success: true,
      message: `📝 **Video Analysis Complete**\n\n**Video:** ${metadata.title}\n**Author:** ${metadata.author_name}\n**Video ID:** ${videoId}\n**Transcript Length:** ${transcript.length} characters\n\n✅ Transcript successfully extracted and ready for analysis.`,
      transcript,
      videoId,
      videoTitle: metadata.title,
      videoAuthor: metadata.author_name,
      transcriptLength: transcript.length,
      summary:
        transcript.split(" ").slice(0, 200).join(" ") +
        (transcript.split(" ").length > 200 ? "..." : ""),
    };
  } catch {
    return {
      success: false,
      message:
        "❌ An error occurred while fetching the transcript. Please try again.",
      transcript: "",
      videoId: "",
      transcriptLength: 0,
      summary: "",
    };
  }
}

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
  } catch {
    // Metadata fetch failed, using defaults
  }
  return { title: "Unknown", author_name: "Unknown" };
}

async function extractTranscriptViaYtDlp(videoId: string): Promise<string> {
  try {
    // Use yt-dlp to get subtitle URLs only (no file downloads)
    const command = `yt-dlp --skip-download --no-warnings --print-json "https://www.youtube.com/watch?v=${videoId}"`;

    try {
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      if (stderr && !stderr.includes("WARNING")) {
        // yt-dlp stderr output (non-warning)
      }

      const data = JSON.parse(stdout);

      // Look for subtitles in the output
      if (data.subtitles || data.automatic_captions) {
        const subtitles = data.subtitles || data.automatic_captions;
        const englishSubs =
          subtitles.en || subtitles["en-US"] || subtitles["en-GB"];

        if (englishSubs && englishSubs.length > 0) {
          // Get the first available English subtitle
          const subtitleUrl = englishSubs[0].url;

          const subtitleResponse = await fetch(subtitleUrl);
          const subtitleContent = await subtitleResponse.text();

          const transcript = parseVTT(subtitleContent);
          if (transcript) {
            return transcript;
          }
        }
      }
    } catch {
      // yt-dlp command failed
      return "";
    }

    return "";
  } catch {
    // yt-dlp method failed
    return "";
  }
}

function parseVTT(content: string): string {
  return content
    .split("\n")
    .filter(
      (line) =>
        !line.startsWith("WEBVTT") &&
        !line.includes("-->") &&
        !line.match(SRT_NUMBER_REGEX) &&
        line.trim()
    )
    .map((line) =>
      line
        .replace(VTT_TIMESTAMP_REGEX, "")
        .replace(VTT_CLOSE_TAG_REGEX, "")
        .replace(HTML_TAG_REGEX, "")
        .replace(TIMESTAMP_REGEX, "")
        .trim()
    )
    .filter(
      (line) =>
        !line.startsWith("Kind:") && !line.startsWith("Language:") && line
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
