import { pipeline } from "@xenova/transformers";

const ENTRY_PREFIX_REGEX = /^[BI]-/;
const PUNCTUATION_REGEX = /[^\w\s]/g;
const WHITESPACE_REGEX = /\s+/;

export type Keyword = {
  word: string;
  entity: string;
  score: number;
};

export type KeywordExtractionResult = {
  keywords: Keyword[];
  groupedKeywords: Record<string, Keyword[]>;
  totalCount: number;
};

export async function extractKeywordsFromTranscript(
  transcript: string
): Promise<KeywordExtractionResult> {
  console.log(
    `🔍 [KEYWORDS] Starting keyword extraction for ${transcript.length} characters`
  );

  // First try NER for named entities
  const nerKeywords = await extractNamedEntities(transcript);

  // If NER finds few entities, fall back to general keyword extraction
  if (nerKeywords.length < 3) {
    console.log(
      "🔍 [KEYWORDS] Few NER entities found, using general keyword extraction"
    );
    const generalKeywords = extractGeneralKeywords(transcript);
    return {
      keywords: generalKeywords,
      groupedKeywords: groupKeywordsByType(generalKeywords),
      totalCount: generalKeywords.length,
    };
  }

  return {
    keywords: nerKeywords,
    groupedKeywords: groupKeywordsByType(nerKeywords),
    totalCount: nerKeywords.length,
  };
}

async function extractNamedEntities(transcript: string): Promise<Keyword[]> {
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
    .filter((item: any) => item.score > 0.5) // Filter by confidence score
    .map((item: any) => ({
      word: item.word,
      entity: item.entity,
      score: item.score,
    }));

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

function extractGeneralKeywords(transcript: string): Keyword[] {
  // Simple keyword extraction using word frequency and importance
  const words = transcript
    .toLowerCase()
    .replace(PUNCTUATION_REGEX, " ") // Remove punctuation
    .split(WHITESPACE_REGEX)
    .filter((word) => word.length > 3) // Filter short words
    .filter((word) => !isStopWord(word)); // Remove stop words

  // Count word frequency
  const wordCount = new Map<string, number>();
  for (const word of words) {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  }

  // Convert to keywords with scores based on frequency and length
  const keywords: Keyword[] = [];
  for (const [word, count] of wordCount.entries()) {
    const score = Math.min((count / words.length) * 10, 1); // Normalize score
    const importance = word.length > 6 ? 1.2 : 1; // Boost longer words
    const finalScore = Math.min(score * importance, 1);

    if (finalScore > 0.1) {
      // Only include words with decent frequency
      keywords.push({
        word: word.charAt(0).toUpperCase() + word.slice(1), // Capitalize
        entity: "KEYWORD",
        score: finalScore,
      });
    }
  }

  return keywords.sort((a, b) => b.score - a.score).slice(0, 20); // Top 20 keywords
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

  for (const [entityType, entityKeywords] of Object.entries(
    result.groupedKeywords
  )) {
    console.log(`\n  📌 ${entityType.toUpperCase()}S:`);
    for (const [index, keyword] of entityKeywords.slice(0, 10).entries()) {
      console.log(
        `    ${index + 1}. "${keyword.word}" - ${(keyword.score * 100).toFixed(1)}%`
      );
    }
    if (entityKeywords.length > 10) {
      console.log(
        `    ... and ${entityKeywords.length - 10} more ${entityType.toLowerCase()}s`
      );
    }
  }
}
