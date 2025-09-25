// ============================================================================
// SHARED CONSTANTS & REGEX PATTERNS
// ============================================================================

export const REGEX_PATTERNS = {
  VIDEO_ID: /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\?|$|&)/,
  SRT_NUMBER: /^\d+$/,
  VTT_TIMESTAMP: /<[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}><c>/g,
  VTT_CLOSE_TAG: /<\/c>/g,
  HTML_TAG: /<[^>]*>/g,
  TIMESTAMP: /[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}/g,
  ENTRY_PREFIX: /^[BI]-/,
  PUNCTUATION: /[^\w\s]/g,
  WHITESPACE: /\s+/,
  ALPHABETIC: /^[a-z]+$/,
  WHITESPACE_MULTIPLE: /\s{2,}/g,
  PUNCTUATION_ONLY: /^[^\w\s]*$/,
  SENTENCE_END: /[.!?]$/,
} as const;

export const CONFIG = {
  MAX_TRANSCRIPT_LENGTH: 10_000,
  MAX_SEGMENTS_RETURN: 15,
  CHUNK_SIZE: 1000,
  SAMPLE_SIZE: 500,
  API: {
    google_knowledge: {
      enabled: true,
      apiKey: process.env.GOOGLE_KNOWLEDGE_API_KEY,
      baseUrl: "https://kgsearch.googleapis.com/v1/entities:search",
      maxResults: 10,
      timeout: 5000,
    },
  },
} as const;
