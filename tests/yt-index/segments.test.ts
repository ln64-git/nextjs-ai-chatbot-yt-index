import { expect, test } from "@playwright/test";
import { extractSegments } from "../../src/yt-index/utils/segments";

const MULTIPLE_WHITESPACE_REGEX = /\s{2,}/g;

// Test data - sample transcripts for testing
const SAMPLE_TRANSCRIPTS = {
  SIMPLE: "Hello world. This is a test. How are you today?",
  COMPLEX: "Welcome to our tutorial. First, we'll cover the basics. Then, we'll move to advanced topics. Finally, we'll wrap up with a summary.",
  WITH_COMMAS: "In this video, we'll discuss programming, software development, and best practices. We'll cover React, TypeScript, and modern web development.",
  LONG: "This is a comprehensive guide to machine learning. We'll start with the fundamentals. Then, we'll explore various algorithms. After that, we'll implement some examples. Finally, we'll discuss real-world applications and best practices.",
  EMPTY: "",
  SINGLE_SENTENCE: "This is a single sentence without punctuation",
  MULTIPLE_PUNCTUATION: "Hello!!! How are you??? I'm fine... What about you?!",
};

test.describe("Segments Extraction - Unit Tests", () => {
  test("should extract segments from simple transcript", () => {
    const segments = extractSegments(SAMPLE_TRANSCRIPTS.SIMPLE);
    
    expect(segments).toBeDefined();
    expect(Array.isArray(segments)).toBe(true);
    expect(segments.length).toBeGreaterThan(0);
    
    // Should have multiple segments
    expect(segments.length).toBe(3);
    expect(segments[0]).toContain("Hello world");
    expect(segments[1]).toContain("This is a test");
    expect(segments[2]).toContain("How are you today");
  });

  test("should extract segments from complex transcript", () => {
    const segments = extractSegments(SAMPLE_TRANSCRIPTS.COMPLEX);
    
    expect(segments.length).toBe(4);
    expect(segments[0]).toContain("Welcome to our tutorial");
    expect(segments[1]).toContain("First, we'll cover the basics");
    expect(segments[2]).toContain("Then, we'll move to advanced topics");
    expect(segments[3]).toContain("Finally, we'll wrap up with a summary");
  });

  test("should handle commas in segments", () => {
    const segments = extractSegments(SAMPLE_TRANSCRIPTS.WITH_COMMAS);
    
    expect(segments.length).toBeGreaterThan(0);
    
    // Should split on commas for longer segments
    const longSegments = segments.filter(s => s.length > 50);
    expect(longSegments.length).toBeGreaterThan(0);
  });

  test("should handle long transcript", () => {
    const segments = extractSegments(SAMPLE_TRANSCRIPTS.LONG);
    
    expect(segments.length).toBeGreaterThan(0);
    expect(segments.length).toBe(5);
    
    // Each segment should be meaningful
    for (const segment of segments) {
      expect(segment.length).toBeGreaterThan(10);
      expect(segment.trim()).toBeTruthy();
    };
  });

  test("should handle empty transcript", () => {
    const segments = extractSegments(SAMPLE_TRANSCRIPTS.EMPTY);
    
    expect(segments).toEqual([]);
  });

  test("should handle single sentence", () => {
    const segments = extractSegments(SAMPLE_TRANSCRIPTS.SINGLE_SENTENCE);
    
    expect(segments.length).toBe(1);
    expect(segments[0]).toContain("This is a single sentence without punctuation");
  });

  test("should handle multiple punctuation marks", () => {
    const segments = extractSegments(SAMPLE_TRANSCRIPTS.MULTIPLE_PUNCTUATION);
    
    // Some segments might be filtered out due to length requirements
    expect(segments.length).toBeGreaterThan(0);
    expect(segments.length).toBeLessThanOrEqual(4);
    
    // Check that we have meaningful segments
    const segmentText = segments.join(" ").toLowerCase();
    expect(segmentText).toContain("how are you");
    expect(segmentText).toContain("what about you");
  });

  test("should filter out very short segments", () => {
    const transcript = "A. B. C. This is a longer segment. D. E.";
    const segments = extractSegments(transcript);
    
    // Should filter out single character segments
    const shortSegments = segments.filter(s => s.length < 10);
    expect(shortSegments.length).toBe(0);
    
    // Should keep longer segments
    expect(segments.some(s => s.includes("This is a longer segment"))).toBe(true);
  });

  test("should ensure segments end with proper punctuation", () => {
    const transcript = "Hello world This is a test";
    const segments = extractSegments(transcript);
    
    for (const segment of segments) {
      expect(segment.endsWith('.') || segment.endsWith('!') || segment.endsWith('?')).toBe(true);
    };
  });

  test("should handle whitespace properly", () => {
    const transcript = "  Hello   world.   This   is   a   test.   ";
    const segments = extractSegments(transcript);
    
    for (const segment of segments) {

      expect(segment.trim()).toBe(segment); // No leading/trailing whitespace
      expect(segment).not.toMatch(MULTIPLE_WHITESPACE_REGEX); // No multiple consecutive spaces
    };
  });

  test("should return segments in order", () => {
    const transcript = "First sentence. Second sentence. Third sentence.";
    const segments = extractSegments(transcript);
    
    expect(segments[0]).toContain("First sentence");
    expect(segments[1]).toContain("Second sentence");
    expect(segments[2]).toContain("Third sentence");
  });
});
