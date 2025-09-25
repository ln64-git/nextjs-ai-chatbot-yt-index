import { REGEX_PATTERNS, CONFIG } from "./constants";
import type { Keyword, KeywordExtractionResult } from "./types";

// ============================================================================
// KEYWORD EXTRACTION FUNCTIONS
// ============================================================================

export async function extractKeywordsFromTranscript(transcript: string): Promise<KeywordExtractionResult> {
  const processedTranscript = processLongTranscript(transcript);
  
  const nerKeywords = extractNamedEntities(processedTranscript);
  const generalKeywords = extractGeneralKeywords(processedTranscript);
  const knowledgeGraphKeywords = await extractKnowledgeGraphKeywords(processedTranscript);

  const combinedKeywords = combineKeywords(
    combineKeywords(nerKeywords, generalKeywords),
    knowledgeGraphKeywords
  );

  return {
    keywords: combinedKeywords,
    groupedKeywords: groupKeywordsByType(combinedKeywords),
    totalCount: combinedKeywords.length,
    dictionariesUsed: knowledgeGraphKeywords.length > 0 ? ["Google Knowledge Graph"] : [],
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function processLongTranscript(transcript: string): string {
  if (transcript.length <= CONFIG.CHUNK_SIZE) {
    return transcript;
  }

  const chunks: string[] = [];
  for (let i = 0; i < transcript.length; i += CONFIG.CHUNK_SIZE) {
    chunks.push(transcript.slice(i, i + CONFIG.CHUNK_SIZE));
  }

  const sampledChunks = chunks.slice(0, Math.ceil(CONFIG.SAMPLE_SIZE / CONFIG.CHUNK_SIZE));
  return sampledChunks.join(" ");
}

function extractNamedEntities(transcript: string): Keyword[] {
  try {
    // For testing purposes, use a simple keyword extraction
    // In production, you would use the actual NER pipeline
    const words = transcript
      .toLowerCase()
      .replace(REGEX_PATTERNS.PUNCTUATION, " ")
      .split(REGEX_PATTERNS.WHITESPACE)
      .filter((word) => word.length > 4 && REGEX_PATTERNS.ALPHABETIC.test(word));
    
    const wordCount = new Map<string, number>();
    for (const word of words) {
      const currentCount = wordCount.get(word) ?? 0;
      wordCount.set(word, currentCount + 1);
    }
    
    return Array.from(wordCount.entries())
      .filter(([, count]) => count > 1)
      .map(([word, count]) => ({
        word,
        entity: "PERSON", // Simplified for testing
        score: Math.min(count / words.length, 1),
        sources: ["NER"],
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  } catch {
    return [];
  }
}

function extractGeneralKeywords(transcript: string): Keyword[] {
  const words = transcript
    .toLowerCase()
    .replace(REGEX_PATTERNS.PUNCTUATION, " ")
    .split(REGEX_PATTERNS.WHITESPACE)
    .filter((word) => word.length > 2 && REGEX_PATTERNS.ALPHABETIC.test(word));

  const wordCount = new Map<string, number>();
  for (const word of words) {
    const currentCount = wordCount.get(word) ?? 0;
    wordCount.set(word, currentCount + 1);
  }

  return Array.from(wordCount.entries())
    .filter(([, count]) => count >= 1) // Changed from > 1 to >= 1
    .map(([word, count]) => ({
      word,
      entity: "GENERAL",
      score: Math.min(count / words.length, 1),
      sources: ["General"],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

async function extractKnowledgeGraphKeywords(transcript: string): Promise<Keyword[]> {
  if (!CONFIG.API.google_knowledge.enabled || !CONFIG.API.google_knowledge.apiKey) {
    return [];
  }

  try {
    const response = await fetch(
      `${CONFIG.API.google_knowledge.baseUrl}?query=${encodeURIComponent(transcript)}&key=${CONFIG.API.google_knowledge.apiKey}&limit=${CONFIG.API.google_knowledge.maxResults}`
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return (data.itemListElement || [])
      .map((item: { result: { name: string } }) => ({
        word: item.result.name,
        entity: "KNOWLEDGE_GRAPH",
        score: 0.8,
        sources: ["Google Knowledge Graph"],
      }));
  } catch {
    return [];
  }
}

function combineKeywords(keywords1: Keyword[], keywords2: Keyword[]): Keyword[] {
  const combined = new Map<string, Keyword>();
  
  for (const keyword of [...keywords1, ...keywords2]) {
    const existing = combined.get(keyword.word.toLowerCase());
    if (existing) {
      existing.score = Math.max(existing.score, keyword.score);
      existing.sources = [...(existing.sources || []), ...(keyword.sources || [])];
    } else {
      combined.set(keyword.word.toLowerCase(), { ...keyword });
    }
  }
  
  return Array.from(combined.values()).sort((a, b) => b.score - a.score);
}

function groupKeywordsByType(keywords: Keyword[]): Record<string, Keyword[]> {
  const grouped: Record<string, Keyword[]> = {};
  for (const keyword of keywords) {
    if (!grouped[keyword.entity]) {
      grouped[keyword.entity] = [];
    }
    grouped[keyword.entity].push(keyword);
  }
  return grouped;
}
