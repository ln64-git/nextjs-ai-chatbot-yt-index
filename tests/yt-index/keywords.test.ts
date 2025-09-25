import { expect, test } from "@playwright/test";
import { extractKeywordsFromTranscript } from "../../src/yt-index/utils/keywords";

// Test data - sample transcripts for testing
const SAMPLE_TRANSCRIPTS = {
  SHORT: "Hello world, this is a test video about programming and software development.",
  TECHNICAL: "In this tutorial, we'll cover React hooks, TypeScript, and modern web development practices. We'll use Node.js, Express, and MongoDB for the backend.",
  LONG: "Welcome to our comprehensive guide on machine learning and artificial intelligence. Today we'll discuss neural networks, deep learning, computer vision, natural language processing, and data science. We'll cover Python programming, TensorFlow, PyTorch, scikit-learn, and various algorithms including supervised learning, unsupervised learning, and reinforcement learning.",
  MIXED: "The weather today is sunny with a temperature of 75 degrees. We're discussing climate change, global warming, and environmental sustainability. The United Nations has released a new report on carbon emissions.",
};

test.describe("Keywords Extraction - Unit Tests", () => {
  test("should extract keywords from short transcript", async () => {
    const result = await extractKeywordsFromTranscript(SAMPLE_TRANSCRIPTS.SHORT);
    
    expect(result.keywords).toBeDefined();
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.totalCount).toBeGreaterThan(0);
    
    // Should contain programming-related keywords
    const keywords = result.keywords.map(k => k.word.toLowerCase());
    expect(keywords.some(k => k.includes('programming') || k.includes('development'))).toBe(true);
  });

  test("should extract technical keywords from technical transcript", async () => {
    const result = await extractKeywordsFromTranscript(SAMPLE_TRANSCRIPTS.TECHNICAL);
    
    expect(result.keywords.length).toBeGreaterThan(0);
    
    const keywords = result.keywords.map(k => k.word.toLowerCase());
    
    // Should contain technical terms
    expect(keywords.some(k => k.includes('react') || k.includes('typescript'))).toBe(true);
    expect(keywords.some(k => k.includes('node') || k.includes('express'))).toBe(true);
    expect(keywords.some(k => k.includes('mongodb') || k.includes('backend'))).toBe(true);
  });

  test("should extract ML/AI keywords from long transcript", async () => {
    const result = await extractKeywordsFromTranscript(SAMPLE_TRANSCRIPTS.LONG);
    
    expect(result.keywords.length).toBeGreaterThan(0);
    
    const keywords = result.keywords.map(k => k.word.toLowerCase());
    
    // Should contain ML/AI terms
    expect(keywords.some(k => k.includes('machine') || k.includes('learning'))).toBe(true);
    expect(keywords.some(k => k.includes('neural') || k.includes('network'))).toBe(true);
    expect(keywords.some(k => k.includes('python') || k.includes('tensorflow'))).toBe(true);
  });

  test("should extract mixed domain keywords", async () => {
    const result = await extractKeywordsFromTranscript(SAMPLE_TRANSCRIPTS.MIXED);
    
    expect(result.keywords.length).toBeGreaterThan(0);
    
    const keywords = result.keywords.map(k => k.word.toLowerCase());
    
    // Should contain weather and environmental terms
    expect(keywords.some(k => k.includes('weather') || k.includes('temperature'))).toBe(true);
    expect(keywords.some(k => k.includes('climate') || k.includes('environmental'))).toBe(true);
  });

  test("should handle empty transcript", async () => {
    const result = await extractKeywordsFromTranscript("");
    
    expect(result.keywords).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  test("should group keywords by entity type", async () => {
    const result = await extractKeywordsFromTranscript(SAMPLE_TRANSCRIPTS.TECHNICAL);
    
    expect(result.groupedKeywords).toBeDefined();
    expect(typeof result.groupedKeywords).toBe('object');
    
    // Should have different entity types
    const entityTypes = Object.keys(result.groupedKeywords);
    expect(entityTypes.length).toBeGreaterThan(0);
  });

  test("should return keywords with scores", async () => {
    const result = await extractKeywordsFromTranscript(SAMPLE_TRANSCRIPTS.SHORT);
    
    expect(result.keywords.length).toBeGreaterThan(0);
    
    // All keywords should have valid scores
    for (const keyword of result.keywords) {
      expect(keyword.score).toBeGreaterThan(0);
      expect(keyword.score).toBeLessThanOrEqual(1);
      expect(keyword.word).toBeTruthy();
      expect(keyword.entity).toBeTruthy();
    };
  });

  test("should handle very long transcripts", async () => {
    // Create a very long transcript
    const longTranscript = SAMPLE_TRANSCRIPTS.LONG.repeat(100);
    
    const result = await extractKeywordsFromTranscript(longTranscript);
    
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.totalCount).toBeGreaterThan(0);
  });
});
