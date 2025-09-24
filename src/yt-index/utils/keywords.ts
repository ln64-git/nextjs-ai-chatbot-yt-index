import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pipeline } from "@xenova/transformers";

const ENTRY_PREFIX_REGEX = /^[BI]-/;
const PUNCTUATION_REGEX = /[^\w\s]/g;
const WHITESPACE_REGEX = /\s+/;

// Dictionary types and interfaces
export type DictionarySource =
  | { type: "file"; path: string; weight?: number }
  | { type: "url"; url: string; weight?: number }
  | { type: "inline"; terms: string[]; weight?: number }
  | { type: "api"; endpoint: string; weight?: number }
  | { type: "urban_dictionary"; weight?: number }
  | { type: "wikipedia"; weight?: number }
  | { type: "wordnet"; weight?: number }
  | { type: "google_knowledge"; weight?: number };

export type Dictionary = {
  name: string;
  terms: Set<string>;
  weight: number;
  categories?: string[];
};

export type DictionaryConfig = {
  dictionaries: DictionarySource[];
  fallbackWeight?: number;
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

export type Keyword = {
  word: string;
  entity: string;
  score: number;
  sources?: string[]; // Track which dictionaries contributed to this keyword
};

export type KeywordExtractionResult = {
  keywords: Keyword[];
  groupedKeywords: Record<string, Keyword[]>;
  totalCount: number;
  dictionariesUsed?: string[];
};

// Global dictionary cache
const dictionaryCache: Map<string, Dictionary> = new Map();

// External API configurations
const EXTERNAL_APIS = {
  urban_dictionary: "https://api.urbandictionary.com/v0/define",
  wikipedia: "https://en.wikipedia.org/api/rest_v1/page/summary",
  wordnet: "https://api.wordnik.com/v4/word.json",
  google_knowledge: "https://kgsearch.googleapis.com/v1/entities:search",
} as const;

// Regex patterns for performance
const WORD_PATTERN = /^[a-z]+$/;
const PROPER_NOUN_PATTERN = /^[A-Z][a-z]+$/;
const TECHNICAL_WORD_PATTERN = /^[a-z]+$/;
const WHITESPACE_PATTERN = /\s+/;

// Import API configuration from config file
import { API_KEYS } from "../config/api-keys";

const API_CONFIG = {
  urban_dictionary: {
    enabled: API_KEYS.URBAN_DICTIONARY.enabled,
    rateLimit: API_KEYS.URBAN_DICTIONARY.rateLimit,
    timeout: API_KEYS.URBAN_DICTIONARY.timeout,
  },
  wikipedia: {
    enabled: API_KEYS.WIKIPEDIA.enabled,
    rateLimit: API_KEYS.WIKIPEDIA.rateLimit,
    timeout: API_KEYS.WIKIPEDIA.timeout,
  },
  wordnet: {
    enabled: API_KEYS.WORDNET.enabled,
    apiKey: API_KEYS.WORDNET.apiKey,
    rateLimit: API_KEYS.WORDNET.rateLimit,
    timeout: API_KEYS.WORDNET.timeout,
  },
  google_knowledge: {
    enabled: API_KEYS.GOOGLE_KNOWLEDGE.enabled,
    apiKey: API_KEYS.GOOGLE_KNOWLEDGE.apiKey,
    rateLimit: API_KEYS.GOOGLE_KNOWLEDGE.rateLimit,
    timeout: API_KEYS.GOOGLE_KNOWLEDGE.timeout,
  },
} as const;

// External API helper functions
async function fetchUrbanDictionaryTerms(
  transcript: string
): Promise<string[]> {
  if (!API_CONFIG.urban_dictionary.enabled) {
    console.warn("Urban Dictionary API is disabled");
    return [];
  }

  try {
    // Extract potential slang/urban terms from transcript
    const words = transcript
      .toLowerCase()
      .split(WHITESPACE_PATTERN)
      .filter(
        (word) =>
          word.length > 3 && !isStopWord(word) && WORD_PATTERN.test(word)
      );

    const terms: string[] = [];

    // Check each word against Urban Dictionary
    for (const word of words.slice(0, 10)) {
      // Limit to avoid rate limits
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          API_CONFIG.urban_dictionary.timeout
        );

        const response = await fetch(
          `${EXTERNAL_APIS.urban_dictionary}?term=${encodeURIComponent(word)}`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();

          if (data.list && data.list.length > 0) {
            terms.push(word);
            // Also add related terms from definitions
            for (const item of data.list) {
              if (item.definition) {
                const relatedWords = item.definition
                  .toLowerCase()
                  .split(WHITESPACE_PATTERN)
                  .filter((w: string) => w.length > 3 && WORD_PATTERN.test(w))
                  .slice(0, 3);
                terms.push(...relatedWords);
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.warn(`Urban Dictionary request timeout for "${word}"`);
        } else {
          console.warn(
            `Failed to fetch Urban Dictionary for "${word}":`,
            error
          );
        }
      }
    }

    return [...new Set(terms)]; // Remove duplicates
  } catch (error) {
    console.error("Urban Dictionary API error:", error);
    return [];
  }
}

async function fetchWikipediaTerms(transcript: string): Promise<string[]> {
  if (!API_CONFIG.wikipedia.enabled) {
    console.warn("Wikipedia API is disabled");
    return [];
  }

  try {
    // Extract potential Wikipedia entities
    const words = transcript.split(WHITESPACE_PATTERN).filter(
      (word) => word.length > 3 && PROPER_NOUN_PATTERN.test(word) // Proper nouns
    );

    const terms: string[] = [];

    for (const word of words.slice(0, 5)) {
      // Limit to avoid rate limits
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          API_CONFIG.wikipedia.timeout
        );

        const response = await fetch(
          `${EXTERNAL_APIS.wikipedia}/${encodeURIComponent(word)}`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();

          if (data.title && !data.type?.includes("disambiguation")) {
            terms.push(word.toLowerCase());
            // Add related terms from extract
            if (data.extract) {
              const relatedWords = data.extract
                .toLowerCase()
                .split(WHITESPACE_PATTERN)
                .filter((w: string) => w.length > 3 && WORD_PATTERN.test(w))
                .slice(0, 5);
              terms.push(...relatedWords);
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.warn(`Wikipedia request timeout for "${word}"`);
        } else {
          console.warn(`Failed to fetch Wikipedia for "${word}":`, error);
        }
      }
    }

    return [...new Set(terms)]; // Remove duplicates
  } catch (error) {
    console.error("Wikipedia API error:", error);
    return [];
  }
}

async function fetchWordNetTerms(transcript: string): Promise<string[]> {
  try {
    // Extract technical/formal terms
    const words = transcript
      .toLowerCase()
      .split(WHITESPACE_PATTERN)
      .filter(
        (word) =>
          word.length > 4 &&
          !isStopWord(word) &&
          TECHNICAL_WORD_PATTERN.test(word)
      );

    const terms: string[] = [];

    for (const word of words.slice(0, 8)) {
      // Limit to avoid rate limits
      try {
        // Note: WordNet API requires API key, so we'll simulate with a basic check
        // In production, you'd need to sign up for WordNik API
        const response = await fetch(
          `${EXTERNAL_APIS.wordnet}/${word}/definitions?limit=1&api_key=YOUR_API_KEY`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            terms.push(word);
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch WordNet for "${word}":`, error);
      }
    }

    return [...new Set(terms)]; // Remove duplicates
  } catch (error) {
    console.error("WordNet API error:", error);
    return [];
  }
}

async function fetchGoogleKnowledgeTerms(
  transcript: string
): Promise<string[]> {
  if (!API_CONFIG.google_knowledge.enabled) {
    console.warn("Google Knowledge Graph API is disabled");
    return [];
  }

  try {
    // Extract entities using Google Knowledge Graph
    const words = transcript.split(WHITESPACE_PATTERN).filter(
      (word) => word.length > 3 && PROPER_NOUN_PATTERN.test(word) // Proper nouns
    );

    const terms: string[] = [];

    for (const word of words.slice(0, 5)) {
      // Limit to avoid rate limits
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          API_CONFIG.google_knowledge.timeout
        );

        const response = await fetch(
          `${EXTERNAL_APIS.google_knowledge}?query=${encodeURIComponent(word)}&key=${API_CONFIG.google_knowledge.apiKey}&limit=1`,
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.itemListElement && data.itemListElement.length > 0) {
            terms.push(word.toLowerCase());
            // Add related terms from description
            const entity = data.itemListElement[0].result;
            if (entity.detailedDescription?.articleBody) {
              const relatedWords = entity.detailedDescription.articleBody
                .toLowerCase()
                .split(WHITESPACE_PATTERN)
                .filter((w: string) => w.length > 3 && WORD_PATTERN.test(w))
                .slice(0, 5);
              terms.push(...relatedWords);
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.warn(`Google Knowledge request timeout for "${word}"`);
        } else {
          console.warn(
            `Failed to fetch Google Knowledge for "${word}":`,
            error
          );
        }
      }
    }

    return [...new Set(terms)]; // Remove duplicates
  } catch (error) {
    console.error("Google Knowledge API error:", error);
    return [];
  }
}

// Load dictionary from various sources
export function loadDictionary(source: DictionarySource): Promise<Dictionary> {
  const cacheKey = JSON.stringify(source);

  if (dictionaryCache.has(cacheKey)) {
    const cached = dictionaryCache.get(cacheKey);
    if (cached) {
      return Promise.resolve(cached);
    }
  }

  let terms: string[] = [];
  let name = "Unknown";

  try {
    switch (source.type) {
      case "file": {
        const filePath = source.path.startsWith("/")
          ? source.path
          : join(process.cwd(), source.path);
        const content = readFileSync(filePath, "utf-8");
        terms = content
          .split("\n")
          .map((term) => term.trim().toLowerCase())
          .filter((term) => term.length > 0);
        name = `File: ${source.path}`;
        break;
      }

      case "inline": {
        terms = source.terms.map((term) => term.toLowerCase());
        name = "Inline Dictionary";
        break;
      }

      case "url": {
        // For URL loading, you'd typically use fetch in a real implementation
        console.warn("URL dictionary loading not implemented yet");
        terms = [];
        name = `URL: ${source.url}`;
        break;
      }

      case "api": {
        // For API loading, you'd typically use fetch in a real implementation
        console.warn("API dictionary loading not implemented yet");
        terms = [];
        name = `API: ${source.endpoint}`;
        break;
      }

      case "urban_dictionary": {
        console.warn(
          "Urban Dictionary requires transcript context - use loadDynamicDictionary instead"
        );
        terms = [];
        name = "Urban Dictionary";
        break;
      }

      case "wikipedia": {
        console.warn(
          "Wikipedia requires transcript context - use loadDynamicDictionary instead"
        );
        terms = [];
        name = "Wikipedia";
        break;
      }

      case "wordnet": {
        console.warn(
          "WordNet requires transcript context - use loadDynamicDictionary instead"
        );
        terms = [];
        name = "WordNet";
        break;
      }

      case "google_knowledge": {
        console.warn(
          "Google Knowledge requires transcript context - use loadDynamicDictionary instead"
        );
        terms = [];
        name = "Google Knowledge Graph";
        break;
      }

      default:
        throw new Error(
          `Unsupported dictionary source type: ${(source as any).type}`
        );
    }

    const dictionary: Dictionary = {
      name,
      terms: new Set(terms),
      weight: source.weight || 1.0,
    };

    dictionaryCache.set(cacheKey, dictionary);
    return Promise.resolve(dictionary);
  } catch (error) {
    console.error(`Failed to load dictionary from ${source}:`, error);
    return Promise.resolve({
      name: "Error",
      terms: new Set(),
      weight: 0,
    });
  }
}

// Load multiple dictionaries
export async function loadDictionaries(
  config: DictionaryConfig
): Promise<Dictionary[]> {
  const dictionaries: Dictionary[] = [];

  for (const source of config.dictionaries) {
    try {
      const dictionary = await loadDictionary(source);
      if (dictionary.terms.size > 0) {
        dictionaries.push(dictionary);
        console.log(
          "📚 [DICTIONARY] Loaded",
          dictionary.terms.size,
          "terms from",
          dictionary.name
        );
      }
    } catch (error) {
      console.error("Failed to load dictionary:", error);
    }
  }

  return dictionaries;
}

// Load dynamic dictionaries based on transcript content
export async function loadDynamicDictionaries(
  transcript: string,
  sources: Array<
    "urban_dictionary" | "wikipedia" | "wordnet" | "google_knowledge"
  >,
  weights: Record<string, number> = {}
): Promise<Dictionary[]> {
  const dictionaries: Dictionary[] = [];

  for (const sourceType of sources) {
    try {
      let terms: string[] = [];
      let name = "";

      switch (sourceType) {
        case "urban_dictionary": {
          terms = await fetchUrbanDictionaryTerms(transcript);
          name = "Urban Dictionary";
          break;
        }
        case "wikipedia": {
          terms = await fetchWikipediaTerms(transcript);
          name = "Wikipedia";
          break;
        }
        case "wordnet": {
          terms = await fetchWordNetTerms(transcript);
          name = "WordNet";
          break;
        }
        case "google_knowledge": {
          terms = await fetchGoogleKnowledgeTerms(transcript);
          name = "Google Knowledge Graph";
          break;
        }
        default: {
          console.warn(`Unknown dynamic source: ${sourceType}`);
          terms = [];
          name = "Unknown";
          break;
        }
      }

      if (terms.length > 0) {
        const dictionary: Dictionary = {
          name,
          terms: new Set(terms),
          weight: weights[sourceType] || 1.0,
        };
        dictionaries.push(dictionary);
        console.log(
          "🌐 [DYNAMIC] Loaded",
          dictionary.terms.size,
          "terms from",
          dictionary.name
        );
      }
    } catch (error) {
      console.error(`Failed to load dynamic dictionary ${sourceType}:`, error);
    }
  }

  return dictionaries;
}

// Get dictionary score for a word
function getDictionaryScore(
  word: string,
  dictionaries: Dictionary[]
): { score: number; sources: string[] } {
  let totalScore = 0;
  const sources: string[] = [];

  for (const dictionary of dictionaries) {
    if (dictionary.terms.has(word.toLowerCase())) {
      totalScore += dictionary.weight;
      sources.push(dictionary.name);
    }
  }

  return { score: totalScore, sources };
}

// Predefined dictionary configurations
export const DICTIONARY_CONFIGS = {
  // Technical programming terms
  programming: {
    dictionaries: [
      {
        type: "inline" as const,
        terms: [
          "javascript",
          "typescript",
          "python",
          "java",
          "csharp",
          "cpp",
          "c",
          "go",
          "rust",
          "php",
          "react",
          "vue",
          "angular",
          "svelte",
          "nextjs",
          "nuxt",
          "gatsby",
          "sveltekit",
          "nodejs",
          "express",
          "fastapi",
          "django",
          "flask",
          "spring",
          "laravel",
          "rails",
          "mongodb",
          "postgresql",
          "mysql",
          "redis",
          "elasticsearch",
          "sqlite",
          "docker",
          "kubernetes",
          "aws",
          "azure",
          "gcp",
          "vercel",
          "netlify",
          "git",
          "github",
          "gitlab",
          "bitbucket",
          "ci",
          "cd",
          "devops",
          "api",
          "rest",
          "graphql",
          "grpc",
          "microservices",
          "serverless",
          "testing",
          "jest",
          "cypress",
          "playwright",
          "unit",
          "integration",
          "e2e",
          "typescript",
          "eslint",
          "prettier",
          "webpack",
          "vite",
          "rollup",
          "babel",
        ],
        weight: 1.5,
      },
    ],
    fallbackWeight: 0.1,
  },

  // Business and finance terms
  business: {
    dictionaries: [
      {
        type: "inline" as const,
        terms: [
          "revenue",
          "profit",
          "margin",
          "roi",
          "kpi",
          "metrics",
          "analytics",
          "dashboard",
          "strategy",
          "marketing",
          "sales",
          "customer",
          "acquisition",
          "retention",
          "churn",
          "startup",
          "venture",
          "capital",
          "funding",
          "investment",
          "valuation",
          "ipo",
          "leadership",
          "management",
          "team",
          "culture",
          "productivity",
          "efficiency",
          "market",
          "competition",
          "competitive",
          "advantage",
          "differentiation",
          "brand",
          "branding",
          "positioning",
          "messaging",
          "content",
          "social",
          "media",
          "growth",
          "scaling",
          "expansion",
          "international",
          "global",
          "localization",
        ],
        weight: 1.3,
      },
    ],
    fallbackWeight: 0.1,
  },

  // Gaming terms
  gaming: {
    dictionaries: [
      {
        type: "inline" as const,
        terms: [
          "gameplay",
          "mechanics",
          "strategy",
          "tactics",
          "combat",
          "battle",
          "fight",
          "quest",
          "mission",
          "objective",
          "goal",
          "achievement",
          "unlock",
          "progress",
          "level",
          "experience",
          "xp",
          "skill",
          "ability",
          "power",
          "upgrade",
          "gear",
          "character",
          "class",
          "build",
          "meta",
          "balance",
          "patch",
          "update",
          "multiplayer",
          "coop",
          "pvp",
          "pve",
          "raid",
          "dungeon",
          "boss",
          "enemy",
          "gaming",
          "gamer",
          "streaming",
          "twitch",
          "youtube",
          "content",
          "creator",
        ],
        weight: 1.4,
      },
    ],
    fallbackWeight: 0.1,
  },

  // Combined configuration
  comprehensive: {
    dictionaries: [
      {
        type: "inline" as const,
        terms: [
          // Technical terms
          "javascript",
          "typescript",
          "python",
          "react",
          "nodejs",
          "api",
          "database",
          "machine",
          "learning",
          "artificial",
          "intelligence",
          "neural",
          "networks",
          "tutorial",
          "guide",
          "tutorials",
          "coding",
          "programming",
          "development",
          // Business terms
          "strategy",
          "marketing",
          "sales",
          "revenue",
          "profit",
          "growth",
          "startup",
          "investment",
          "funding",
          "leadership",
          "management",
          "team",
          "culture",
          // Gaming terms
          "gameplay",
          "strategy",
          "tactics",
          "combat",
          "quest",
          "mission",
          "level",
          "character",
          "multiplayer",
          "gaming",
          "streaming",
          "content",
          "creator",
          // General high-value terms
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
        ],
        weight: 1.2,
      },
    ],
    fallbackWeight: 0.1,
  },
};

export async function extractKeywordsFromTranscript(
  transcript: string,
  dictionaryConfig?: DictionaryConfig,
  dynamicSources?: Array<
    "urban_dictionary" | "wikipedia" | "wordnet" | "google_knowledge"
  >,
  dynamicWeights?: Record<string, number>
): Promise<KeywordExtractionResult> {
  console.log(
    `🔍 [KEYWORDS] Starting keyword extraction for ${transcript.length} characters`
  );

  // Load static dictionaries if config provided
  let dictionaries: Dictionary[] = [];
  if (dictionaryConfig) {
    dictionaries = await loadDictionaries(dictionaryConfig);
    console.log(
      `📚 [DICTIONARY] Using ${dictionaries.length} static dictionaries`
    );
  }

  // Load dynamic dictionaries if provided
  if (dynamicSources && dynamicSources.length > 0) {
    const dynamicDictionaries = await loadDynamicDictionaries(
      transcript,
      dynamicSources,
      dynamicWeights
    );
    dictionaries.push(...dynamicDictionaries);
    console.log(
      `🌐 [DYNAMIC] Added ${dynamicDictionaries.length} dynamic dictionaries`
    );
  }

  // Extract keywords using both NER and general methods
  const nerKeywords = await extractNamedEntities(transcript, dictionaries);
  const generalKeywords = extractGeneralKeywords(transcript, dictionaries);
  const dictionaryKeywords = extractDictionaryKeywords(
    transcript,
    dictionaries
  );

  console.log(
    `🔍 [KEYWORDS] NER found ${nerKeywords.length} entities, general found ${generalKeywords.length} keywords, dictionaries found ${dictionaryKeywords.length} keywords`
  );

  // Combine all methods for better coverage
  const combinedKeywords = combineKeywords(
    combineKeywords(nerKeywords, generalKeywords),
    dictionaryKeywords
  );

  return {
    keywords: combinedKeywords,
    groupedKeywords: groupKeywordsByType(combinedKeywords),
    totalCount: combinedKeywords.length,
    dictionariesUsed: dictionaries.map((d) => d.name),
  };
}

async function extractNamedEntities(
  transcript: string,
  dictionaries: Dictionary[] = []
): Promise<Keyword[]> {
  const ner = await pipeline("ner", "Xenova/bert-base-NER");

  // Process transcript in chunks to avoid length limitations
  const chunkSize = 1000;
  const chunks: string[] = [];

  for (let i = 0; i < transcript.length; i += chunkSize) {
    chunks.push(transcript.slice(i, i + chunkSize));
  }

  console.log(
    `🔍 [NER] Processing ${chunks.length} chunks of ${chunkSize} characters each`
  );

  let allResults: any[] = [];
  for (const chunkText of chunks) {
    if (chunkText) {
      const chunkResults = await ner(chunkText);
      allResults = allResults.concat(chunkResults);
    }
  }

  // Extract and process keywords from NER results
  const rawKeywords = allResults
    .filter((item: any) => item.score > 0.3) // Relaxed confidence threshold
    .map((item: any) => {
      const word = item.word;
      const entity = mapEntityType(item.entity);
      const baseScore = item.score;

      // Apply dictionary boosting
      const dictResult = getDictionaryScore(word, dictionaries);
      const finalScore = baseScore + dictResult.score * 0.3; // 30% boost from dictionaries

      return {
        word,
        entity,
        score: Math.min(finalScore, 1),
        sources: dictResult.sources.length > 0 ? dictResult.sources : undefined,
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

function extractDictionaryKeywords(
  transcript: string,
  dictionaries: Dictionary[]
): Keyword[] {
  const keywords: Keyword[] = [];
  const transcriptLower = transcript.toLowerCase();

  for (const dictionary of dictionaries) {
    for (const term of dictionary.terms) {
      // Check if the term appears in the transcript (case-insensitive)
      if (transcriptLower.includes(term.toLowerCase())) {
        // Calculate relevance score based on term length and dictionary weight
        const lengthScore = Math.min(term.length / 15, 1);
        const weightScore = dictionary.weight;
        const score = (lengthScore * 0.6 + weightScore * 0.4) * 0.8; // Scale down to avoid over-boosting

        keywords.push({
          word: term.charAt(0).toUpperCase() + term.slice(1),
          entity: "DICTIONARY",
          score: Math.min(score, 1),
          sources: [dictionary.name],
        });
      }
    }
  }

  return keywords.sort((a, b) => b.score - a.score);
}

function extractGeneralKeywords(
  transcript: string,
  dictionaries: Dictionary[] = []
): Keyword[] {
  // Enhanced keyword extraction with domain-specific improvements
  const words = transcript
    .toLowerCase()
    .replace(PUNCTUATION_REGEX, " ") // Remove punctuation
    .split(WHITESPACE_REGEX)
    .filter((word) => word.length > 2) // Allow slightly shorter words for technical terms
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

    // Apply dictionary boosting
    const dictResult = getDictionaryScore(word, dictionaries);
    const dictionaryBoost = dictResult.score * 0.4; // 40% boost from dictionaries

    const score =
      frequency * 0.4 +
      lengthScore * 0.15 +
      technicalScore * 0.15 +
      domainScore * 0.1 +
      dictionaryBoost;

    if (score > 0.05) {
      // Lower threshold to catch more relevant terms
      keywords.push({
        word: word.charAt(0).toUpperCase() + word.slice(1), // Capitalize
        entity: "KEYWORD",
        score: Math.min(score, 1),
        sources: dictResult.sources.length > 0 ? dictResult.sources : undefined,
      });
    }
  }

  return keywords.sort((a, b) => b.score - a.score).slice(0, 25); // Top 25 keywords
}

// Boost technical and domain-specific terms
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
    "epic",
    "session",
    "leaderboard",
    "updates",
    "productivity",
    "motivation",
    "routine",
    "meditation",
    "exercise",
    "healthy",
    "lifestyle",
    "balance",
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

export function logKeywords(result: KeywordExtractionResult): void {
  console.log(`🔍 [KEYWORDS] Found ${result.totalCount} unique keywords:`);

  if (result.dictionariesUsed && result.dictionariesUsed.length > 0) {
    console.log(
      `📚 [DICTIONARY] Using dictionaries: ${result.dictionariesUsed.join(", ")}`
    );
  }

  for (const [entityType, entityKeywords] of Object.entries(
    result.groupedKeywords
  )) {
    console.log(`\n  📌 ${entityType.toUpperCase()}S:`);
    for (const [index, keyword] of entityKeywords.slice(0, 10).entries()) {
      const sources = keyword.sources ? ` (${keyword.sources.join(", ")})` : "";
      console.log(
        `    ${index + 1}. "${keyword.word}" - ${(keyword.score * 100).toFixed(1)}%${sources}`
      );
    }
    if (entityKeywords.length > 10) {
      console.log(
        `    ... and ${entityKeywords.length - 10} more ${entityType.toLowerCase()}s`
      );
    }
  }
}
