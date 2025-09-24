/**
 * API Keys Configuration
 *
 * This file contains configuration for external dictionary APIs.
 * Copy this file to api-keys.local.ts and add your actual API keys.
 *
 * IMPORTANT: Never commit actual API keys to version control!
 */

export const API_KEYS = {
  // Urban Dictionary - Disabled (only using Google Knowledge Graph)
  URBAN_DICTIONARY: {
    enabled: false, // Disabled - only using Google Knowledge Graph
    rateLimit: 100, // requests per minute
    timeout: 5000, // 5 seconds
  },

  // Wikipedia - Disabled (only using Google Knowledge Graph)
  WIKIPEDIA: {
    enabled: false, // Disabled - only using Google Knowledge Graph
    rateLimit: 200, // requests per minute
    timeout: 3000, // 3 seconds
  },

  // WordNet via WordNik - Disabled (only using Google Knowledge Graph)
  WORDNET: {
    enabled: false, // Disabled - only using Google Knowledge Graph
    apiKey: process.env.WORDNIK_API_KEY || "YOUR_WORDNIK_API_KEY",
    rateLimit: 50, // requests per minute
    timeout: 5000, // 5 seconds
  },

  // Google Knowledge Graph - Only enabled source
  GOOGLE_KNOWLEDGE: {
    enabled: true, // Only this one is enabled
    apiKey: process.env.GOOGLE_KNOWLEDGE_API_KEY || "YOUR_GOOGLE_API_KEY",
    rateLimit: 30, // requests per minute
    timeout: 5000, // 5 seconds
  },
} as const;

// Rate limiting configuration
export const RATE_LIMITS = {
  // Global rate limiting
  maxConcurrentRequests: 5,
  requestDelay: 100, // milliseconds between requests

  // Per-API rate limiting
  perApiLimits: {
    urban_dictionary: 10, // requests per minute
    wikipedia: 20, // requests per minute
    wordnet: 5, // requests per minute
    google_knowledge: 3, // requests per minute
  },
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  // Cache duration in milliseconds
  duration: 24 * 60 * 60 * 1000, // 24 hours

  // Maximum cache size
  maxSize: 1000, // entries

  // Cache cleanup interval
  cleanupInterval: 60 * 60 * 1000, // 1 hour
} as const;

// Error handling configuration
export const ERROR_CONFIG = {
  // Maximum retry attempts
  maxRetries: 3,

  // Retry delay in milliseconds
  retryDelay: 1000,

  // Timeout for individual requests
  requestTimeout: 10_000, // 10 seconds

  // Fallback behavior
  fallbackOnError: true,
  logErrors: true,
} as const;

// How to get API keys:
export const API_KEY_INSTRUCTIONS = {
  wordnet: {
    url: "https://www.wordnik.com/",
    steps: [
      "1. Visit https://www.wordnik.com/",
      "2. Sign up for a free account",
      "3. Go to your account settings",
      "4. Generate an API key",
      "5. Add it to your environment variables as WORDNIK_API_KEY",
    ],
    freeTier: "1,000 requests per day",
  },

  google_knowledge: {
    url: "https://developers.google.com/knowledge-graph",
    steps: [
      "1. Visit https://developers.google.com/knowledge-graph",
      "2. Click 'Get Started'",
      "3. Create a new project or select existing",
      "4. Enable the Knowledge Graph Search API",
      "5. Create credentials (API key)",
      "6. Add it to your environment variables as GOOGLE_KNOWLEDGE_API_KEY",
    ],
    freeTier: "100,000 requests per day",
  },
} as const;
