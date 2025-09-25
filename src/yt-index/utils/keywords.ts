import { pipeline } from "@xenova/transformers";

// Regex patterns
const ENTRY_PREFIX_REGEX = /^[BI]-/;
const PUNCTUATION_REGEX = /[^\w\s]/g;
const WHITESPACE_REGEX = /\s+/;
const ALPHABETIC_REGEX = /^[a-z]+$/;

// API Configuration
const API_CONFIG = {
  google_knowledge: {
    enabled: true,
    apiKey: process.env.GOOGLE_KNOWLEDGE_API_KEY,
    baseUrl: "https://kgsearch.googleapis.com/v1/entities:search",
    maxResults: 10,
    timeout: 5000,
  },
};

// Core types
export type Keyword = {
  word: string;
  entity: string;
  score: number;
  sources?: string[];
};

export type KeywordExtractionResult = {
  keywords: Keyword[];
  groupedKeywords: Record<string, Keyword[]>;
  totalCount: number;
  dictionariesUsed?: string[];
};

// Map NER entity types to standard categories
function mapEntityType(entity: string): string {
  const entityMap: Record<string, string> = {
    "B-PER": "PERSON",
    "I-PER": "PERSON",
    "B-ORG": "ORG",
    "I-ORG": "ORG",
    "B-LOC": "LOCATION",
    "I-LOC": "LOCATION",
    "B-MISC": "MISC",
    "I-MISC": "MISC",
  };
  return entityMap[entity] || "KEYWORD";
}

// Regex for sentence splitting - defined at top level for performance
const SENTENCE_SPLIT_REGEX = /[.!?]+/;

// Process long transcripts by chunking and sampling to avoid context length issues
function processLongTranscript(transcript: string): string {
  const MAX_LENGTH = 50_000; // 50k characters should be safe for most models
  const CHUNK_SIZE = 10_000; // Process in 10k character chunks

  if (transcript.length <= MAX_LENGTH) {
    return transcript;
  }

  // Split into sentences for better chunking
  const sentences = transcript
    .split(SENTENCE_SPLIT_REGEX)
    .filter((s) => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > CHUNK_SIZE) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Sample chunks to stay within limits
  let sampledText = "";
  const maxChunks = Math.ceil(MAX_LENGTH / CHUNK_SIZE);

  if (chunks.length <= maxChunks) {
    // Use all chunks if we're within limits
    sampledText = chunks.join(" ");
  } else {
    // Sample chunks evenly distributed
    const step = Math.floor(chunks.length / maxChunks);
    const sampledChunks: string[] = [];

    for (
      let i = 0;
      i < chunks.length && sampledChunks.length < maxChunks;
      i += step
    ) {
      sampledChunks.push(chunks[i]);
    }

    // Add the last chunk to ensure we get the end
    if (chunks.length > 0) {
      const lastChunk = chunks.at(-1);
      if (lastChunk && !sampledChunks.includes(lastChunk)) {
        sampledChunks.push(lastChunk);
      }
    }

    sampledText = sampledChunks.join(" ");
  }

  // If still too long, truncate
  if (sampledText.length > MAX_LENGTH) {
    sampledText = sampledText.substring(0, MAX_LENGTH);
    // Try to end at a sentence boundary
    const lastSentenceEnd = Math.max(
      sampledText.lastIndexOf("."),
      sampledText.lastIndexOf("!"),
      sampledText.lastIndexOf("?")
    );
    if (lastSentenceEnd > MAX_LENGTH * 0.8) {
      sampledText = sampledText.substring(0, lastSentenceEnd + 1);
    }
  }

  return sampledText;
}

// Main keyword extraction function
export async function extractKeywordsFromTranscript(
  transcript: string
): Promise<KeywordExtractionResult> {
  // Handle very long transcripts by chunking and sampling
  const processedTranscript = processLongTranscript(transcript);

  // Extract keywords using NER, general methods, and Knowledge Graph
  const nerKeywords = await extractNamedEntities(processedTranscript);
  const generalKeywords = extractGeneralKeywords(processedTranscript);
  const knowledgeGraphKeywords =
    await extractKnowledgeGraphKeywords(processedTranscript);

  // Combine all methods for better coverage
  const combinedKeywords = combineKeywords(
    combineKeywords(nerKeywords, generalKeywords),
    knowledgeGraphKeywords
  );

  return {
    keywords: combinedKeywords,
    groupedKeywords: groupKeywordsByType(combinedKeywords),
    totalCount: combinedKeywords.length,
    dictionariesUsed:
      knowledgeGraphKeywords.length > 0 ? ["Google Knowledge Graph"] : [],
  };
}

// Extract named entities using NER
async function extractNamedEntities(transcript: string): Promise<Keyword[]> {
  const ner = await pipeline("ner", "Xenova/bert-base-NER");

  // Process transcript in smaller chunks to avoid NER model limitations
  const chunkSize = 500; // Smaller chunks for better NER performance
  const chunks: string[] = [];

  for (let i = 0; i < transcript.length; i += chunkSize) {
    chunks.push(transcript.slice(i, i + chunkSize));
  }

  let allResults: any[] = [];
  for (const chunkText of chunks) {
    if (chunkText.trim()) {
      try {
        const chunkResults = await ner(chunkText);
        allResults = allResults.concat(chunkResults);
      } catch {
        // Error processing chunk, continue with other chunks
      }
    }
  }

  // Extract and process keywords from NER results
  const rawKeywords = allResults
    .filter((item: any) => item.score > 0.3) // Relaxed confidence threshold
    .map((item: any) => {
      const word = item.word;
      const entity = mapEntityType(item.entity);
      const baseScore = item.score;

      return {
        word,
        entity,
        score: Math.min(baseScore, 1),
        sources: ["NER"],
      };
    });

  // Group and deduplicate keywords
  const keywordMap = new Map();
  for (const keyword of rawKeywords) {
    const key = `${keyword.word.toLowerCase()}_${keyword.entity}`;
    if (!keywordMap.has(key) || keywordMap.get(key).score < keyword.score) {
      keywordMap.set(key, keyword);
    }
  }

  return Array.from(keywordMap.values()).sort((a, b) => b.score - a.score);
}

// Extract general keywords using frequency analysis
function extractGeneralKeywords(transcript: string): Keyword[] {
  const words = transcript
    .toLowerCase()
    .replace(PUNCTUATION_REGEX, " ") // Remove punctuation
    .split(WHITESPACE_REGEX)
    .filter((word) => word.length > 2) // Allow slightly shorter words
    .filter((word) => !isStopWord(word)); // Remove stop words

  // Count word frequency
  const wordCount = new Map<string, number>();
  for (const word of words) {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  }

  // Convert to keywords with enhanced scoring
  const keywords: Keyword[] = [];
  for (const [word, count] of wordCount.entries()) {
    const frequency = count / words.length;
    const lengthScore = Math.min(word.length / 12, 1); // Longer words get higher scores
    const technicalScore = getTechnicalTermScore(word); // Boost technical terms
    const domainScore = getDomainSpecificScore(word); // Boost domain-specific terms

    const score =
      frequency * 0.4 +
      lengthScore * 0.15 +
      technicalScore * 0.15 +
      domainScore * 0.1;

    if (score > 0.05) {
      keywords.push({
        word: word.charAt(0).toUpperCase() + word.slice(1), // Capitalize
        entity: "KEYWORD",
        score: Math.min(score, 1),
        sources: ["General"],
      });
    }
  }

  return keywords.sort((a, b) => b.score - a.score).slice(0, 25); // Top 25 keywords
}

// Extract keywords using Google Knowledge Graph
async function extractKnowledgeGraphKeywords(
  transcript: string
): Promise<Keyword[]> {
  if (
    !API_CONFIG.google_knowledge.enabled ||
    !API_CONFIG.google_knowledge.apiKey
  ) {
    return [];
  }

  try {
    // Extract potential entity terms from transcript (longer, meaningful words)
    const potentialTerms = extractPotentialEntityTerms(transcript);

    if (potentialTerms.length === 0) {
      return [];
    }

    const keywords: Keyword[] = [];

    // Query Knowledge Graph for each potential term
    for (const term of potentialTerms.slice(0, 5)) {
      // Limit to top 5 terms to avoid rate limits
      try {
        const entities = await fetchGoogleKnowledgeEntities(term);

        for (const entity of entities) {
          // Check if the entity name appears in the transcript
          if (transcript.toLowerCase().includes(entity.name.toLowerCase())) {
            keywords.push({
              word: entity.name,
              entity: entity.type || "KNOWLEDGE_GRAPH",
              score: calculateKnowledgeGraphScore(entity),
              sources: ["Google Knowledge Graph"],
            });
          }
        }
      } catch {
        // Failed to fetch entities for term
      }
    }

    return keywords.sort((a, b) => b.score - a.score);
  } catch {
    // Knowledge Graph extraction failed
    return [];
  }
}

// Extract potential entity terms from transcript
function extractPotentialEntityTerms(transcript: string): string[] {
  const words = transcript
    .toLowerCase()
    .replace(PUNCTUATION_REGEX, " ")
    .split(WHITESPACE_REGEX)
    .filter((word) => word.length >= 4) // Longer words are more likely to be entities
    .filter((word) => !isStopWord(word))
    .filter((word) => ALPHABETIC_REGEX.test(word)); // Only alphabetic words

  // Count frequency and get most common terms
  const wordCount = new Map<string, number>();
  for (const word of words) {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  }

  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

// Fetch entities from Google Knowledge Graph
async function fetchGoogleKnowledgeEntities(query: string): Promise<any[]> {
  const url = new URL(API_CONFIG.google_knowledge.baseUrl);
  url.searchParams.set("query", query);
  url.searchParams.set("key", API_CONFIG.google_knowledge.apiKey || "");
  url.searchParams.set(
    "limit",
    API_CONFIG.google_knowledge.maxResults.toString()
  );
  url.searchParams.set("indent", "true");

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    API_CONFIG.google_knowledge.timeout
  );

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.itemListElement || !Array.isArray(data.itemListElement)) {
      return [];
    }

    return data.itemListElement.map((item: any) => ({
      name: item.result?.name || "",
      type: item.result?.["@type"]?.[0] || "Thing",
      description: item.result?.description || "",
      detailedDescription: item.result?.detailedDescription?.articleBody || "",
    }));
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Calculate score for Knowledge Graph entities
function calculateKnowledgeGraphScore(entity: any): number {
  let score = 0.7; // Base score for Knowledge Graph entities

  // Boost score based on description length (more detailed = more relevant)
  if (entity.detailedDescription && entity.detailedDescription.length > 100) {
    score += 0.1;
  }

  // Boost score for specific entity types
  const highValueTypes = [
    "Person",
    "Organization",
    "Place",
    "Event",
    "CreativeWork",
  ];
  if (highValueTypes.includes(entity.type)) {
    score += 0.1;
  }

  return Math.min(score, 1);
}

// Combine keywords from different sources
function combineKeywords(
  nerKeywords: Keyword[],
  generalKeywords: Keyword[]
): Keyword[] {
  const keywordMap = new Map<string, Keyword>();

  // Add NER keywords first (they have higher priority)
  for (const keyword of nerKeywords) {
    const key = keyword.word.toLowerCase();
    keywordMap.set(key, keyword);
  }

  // Add general keywords, but don't override NER keywords unless general has higher score
  for (const keyword of generalKeywords) {
    const key = keyword.word.toLowerCase();
    const existing = keywordMap.get(key);

    if (!existing || keyword.score > existing.score) {
      keywordMap.set(key, keyword);
    }
  }

  return Array.from(keywordMap.values()).sort((a, b) => b.score - a.score);
}

// Boost technical terms
function getTechnicalTermScore(word: string): number {
  const technicalTerms = [
    "machine",
    "learning",
    "artificial",
    "intelligence",
    "neural",
    "networks",
    "deep",
    "data",
    "science",
    "python",
    "javascript",
    "typescript",
    "react",
    "node",
    "tensorflow",
    "pytorch",
    "api",
    "database",
    "algorithm",
    "programming",
    "software",
    "development",
    "tutorial",
    "tutorials",
    "coding",
    "code",
    "cryptocurrency",
    "bitcoin",
    "ethereum",
    "blockchain",
    "investment",
    "financial",
    "market",
    "analysis",
    "gaming",
    "game",
    "gameplay",
    "strategy",
    "strategies",
  ];

  return technicalTerms.some((term) => word.includes(term)) ? 0.8 : 0;
}

// Boost domain-specific terms
function getDomainSpecificScore(word: string): number {
  const domainTerms = [
    "tutorial",
    "guide",
    "tips",
    "tricks",
    "hacks",
    "secrets",
    "methods",
    "techniques",
    "advanced",
    "beginner",
    "intermediate",
    "expert",
    "professional",
    "comprehensive",
    "practical",
    "hands-on",
    "step-by-step",
    "detailed",
    "in-depth",
    "complete",
  ];

  return domainTerms.some((term) => word.includes(term)) ? 0.6 : 0;
}

// Check if word is a stop word
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "up",
    "about",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "between",
    "among",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "me",
    "him",
    "her",
    "us",
    "them",
    "my",
    "your",
    "his",
    "her",
    "its",
    "our",
    "their",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "can",
    "must",
    "shall",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "am",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "get",
    "got",
    "gonna",
    "never",
    "always",
    "sometimes",
    "often",
    "usually",
    "really",
    "very",
    "quite",
    "just",
    "only",
    "also",
    "too",
    "either",
    "neither",
    "both",
    "all",
    "some",
    "any",
    "every",
    "each",
  ]);
  return stopWords.has(word.toLowerCase());
}

// Group keywords by entity type
function groupKeywordsByType(keywords: Keyword[]): Record<string, Keyword[]> {
  return keywords.reduce((acc: Record<string, Keyword[]>, keyword) => {
    const entityType = keyword.entity.replace(ENTRY_PREFIX_REGEX, ""); // Remove B-/I- prefix
    if (!acc[entityType]) {
      acc[entityType] = [];
    }
    acc[entityType].push(keyword);
    return acc;
  }, {});
}

// Log keywords for debugging
export function logKeywords(_result: KeywordExtractionResult): void {
  // Debug logging function - can be used for development
  // Implementation removed to clean up console output
}
