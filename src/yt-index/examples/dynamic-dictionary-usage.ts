/**
 * Dynamic Dictionary Usage Examples
 *
 * This file demonstrates how to use external APIs and services
 * to dynamically load dictionaries based on transcript content.
 *
 * Features:
 * - Urban Dictionary API for slang/cultural terms
 * - Wikipedia API for cultural references and entities
 * - WordNet API for technical/formal terms
 * - Google Knowledge Graph for entity recognition
 */

import {
  extractKeywordsFromTranscript,
  loadDynamicDictionaries,
} from "../utils/keywords";

// Example 1: Using Urban Dictionary for slang/cultural terms
export async function exampleUrbanDictionary() {
  console.log("🌆 [EXAMPLE] Urban Dictionary - Slang & Cultural Terms");

  const transcript = `
    Yo, that's totally lit! The party was absolutely banging last night.
    We were vibing hard to some sick beats. That DJ was straight fire!
    Everyone was getting turnt and having a blast. It was definitely 
    the most epic night ever. The crowd was going wild!
  `;

  const result = await extractKeywordsFromTranscript(
    transcript,
    undefined, // No static dictionaries
    ["urban_dictionary"], // Use Urban Dictionary
    { urban_dictionary: 2.0 } // High weight for cultural terms
  );

  console.log(`Found ${result.totalCount} keywords with Urban Dictionary:`);
  result.keywords.slice(0, 10).forEach((keyword, index) => {
    const sources = keyword.sources ? ` (${keyword.sources.join(", ")})` : "";
    console.log(
      `  ${index + 1}. "${keyword.word}" - ${(keyword.score * 100).toFixed(1)}%${sources}`
    );
  });

  return result;
}

// Example 2: Using Wikipedia for cultural references
export async function exampleWikipediaReferences() {
  console.log("📚 [EXAMPLE] Wikipedia - Cultural References & Entities");

  const transcript = `
    The Mona Lisa is one of the most famous paintings in the world.
    It was painted by Leonardo da Vinci during the Italian Renaissance.
    The painting is housed in the Louvre Museum in Paris, France.
    Many people believe it represents Lisa Gherardini, the wife of 
    Francesco del Giocondo. The enigmatic smile has fascinated viewers for centuries.
  `;

  const result = await extractKeywordsFromTranscript(
    transcript,
    undefined, // No static dictionaries
    ["wikipedia"], // Use Wikipedia
    { wikipedia: 1.5 } // Medium-high weight for cultural references
  );

  console.log(`Found ${result.totalCount} keywords with Wikipedia:`);
  result.keywords.slice(0, 10).forEach((keyword, index) => {
    const sources = keyword.sources ? ` (${keyword.sources.join(", ")})` : "";
    console.log(
      `  ${index + 1}. "${keyword.word}" - ${(keyword.score * 100).toFixed(1)}%${sources}`
    );
  });

  return result;
}

// Example 3: Using WordNet for technical terms
export async function exampleWordNetTechnical() {
  console.log("🔬 [EXAMPLE] WordNet - Technical & Formal Terms");

  const transcript = `
    The algorithm utilizes machine learning techniques to process
    natural language data. We implement neural networks with
    backpropagation to optimize the model parameters. The system
    employs convolutional layers and attention mechanisms for
    improved performance in text classification tasks.
  `;

  const result = await extractKeywordsFromTranscript(
    transcript,
    undefined, // No static dictionaries
    ["wordnet"], // Use WordNet
    { wordnet: 1.8 } // High weight for technical terms
  );

  console.log(`Found ${result.totalCount} keywords with WordNet:`);
  result.keywords.slice(0, 10).forEach((keyword, index) => {
    const sources = keyword.sources ? ` (${keyword.sources.join(", ")})` : "";
    console.log(
      `  ${index + 1}. "${keyword.word}" - ${(keyword.score * 100).toFixed(1)}%${sources}`
    );
  });

  return result;
}

// Example 4: Using Google Knowledge Graph for entities
export async function exampleGoogleKnowledgeGraph() {
  console.log("🔍 [EXAMPLE] Google Knowledge Graph - Entity Recognition");

  const transcript = `
    Apple Inc. is a multinational technology company headquartered in Cupertino, California.
    The company was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne in 1976.
    Apple is known for its innovative products like the iPhone, iPad, and Mac computers.
    The company's current CEO is Tim Cook, who succeeded Steve Jobs in 2011.
  `;

  const result = await extractKeywordsFromTranscript(
    transcript,
    undefined, // No static dictionaries
    ["google_knowledge"], // Use Google Knowledge Graph
    { google_knowledge: 2.2 } // Very high weight for entities
  );

  console.log(
    `Found ${result.totalCount} keywords with Google Knowledge Graph:`
  );
  result.keywords.slice(0, 10).forEach((keyword, index) => {
    const sources = keyword.sources ? ` (${keyword.sources.join(", ")})` : "";
    console.log(
      `  ${index + 1}. "${keyword.word}" - ${(keyword.score * 100).toFixed(1)}%${sources}`
    );
  });

  return result;
}

// Example 5: Combining multiple dynamic sources
export async function exampleMultipleDynamicSources() {
  console.log("🌐 [EXAMPLE] Multiple Dynamic Sources - Comprehensive Analysis");

  const transcript = `
    The Matrix is a 1999 science fiction film directed by the Wachowskis.
    It stars Keanu Reeves as Neo, a computer programmer who discovers
    that reality is actually a simulation. The film's visual effects
    were groundbreaking and influenced many subsequent movies.
    The concept of the red pill vs blue pill has become iconic in pop culture.
    The movie explores themes of reality, choice, and human consciousness.
  `;

  const result = await extractKeywordsFromTranscript(
    transcript,
    undefined, // No static dictionaries
    ["urban_dictionary", "wikipedia", "google_knowledge"], // Use multiple sources
    {
      urban_dictionary: 1.0, // Standard weight for cultural terms
      wikipedia: 1.5, // Higher weight for cultural references
      google_knowledge: 2.0, // Highest weight for entities
    }
  );

  console.log(
    `Found ${result.totalCount} keywords with multiple dynamic sources:`
  );
  result.keywords.slice(0, 15).forEach((keyword, index) => {
    const sources = keyword.sources ? ` (${keyword.sources.join(", ")})` : "";
    console.log(
      `  ${index + 1}. "${keyword.word}" - ${(keyword.score * 100).toFixed(1)}%${sources}`
    );
  });

  return result;
}

// Example 6: Custom dynamic dictionary loading
export async function exampleCustomDynamicLoading() {
  console.log("⚙️ [EXAMPLE] Custom Dynamic Dictionary Loading");

  const transcript = `
    This JavaScript tutorial covers async/await, promises, and callbacks.
    We'll learn about closures, hoisting, and the event loop. The code
    uses modern ES6+ features like arrow functions and destructuring.
  `;

  // Load dynamic dictionaries manually
  const dynamicDictionaries = await loadDynamicDictionaries(
    transcript,
    ["wikipedia", "wordnet"], // Only Wikipedia and WordNet
    { wikipedia: 1.0, wordnet: 1.5 } // Custom weights
  );

  console.log(`Loaded ${dynamicDictionaries.length} dynamic dictionaries:`);
  for (const dict of dynamicDictionaries) {
    console.log(
      `  - ${dict.name}: ${dict.terms.size} terms (weight: ${dict.weight})`
    );
  }

  // Use the loaded dictionaries in keyword extraction
  const result = await extractKeywordsFromTranscript(
    transcript,
    undefined, // No static dictionaries
    ["wikipedia", "wordnet"], // Use the same sources
    { wikipedia: 1.0, wordnet: 1.5 } // Same weights
  );

  console.log(
    `Found ${result.totalCount} keywords with custom dynamic loading:`
  );
  result.keywords.slice(0, 10).forEach((keyword, index) => {
    const sources = keyword.sources ? ` (${keyword.sources.join(", ")})` : "";
    console.log(
      `  ${index + 1}. "${keyword.word}" - ${(keyword.score * 100).toFixed(1)}%${sources}`
    );
  });

  return result;
}

// Example 7: Error handling and fallbacks
export async function exampleErrorHandling() {
  console.log("🛡️ [EXAMPLE] Error Handling & Fallbacks");

  const transcript = `
    This is a test transcript with some technical terms and cultural references.
    We'll see how the system handles API failures gracefully.
  `;

  try {
    const result = await extractKeywordsFromTranscript(
      transcript,
      undefined, // No static dictionaries
      ["urban_dictionary", "wikipedia", "wordnet", "google_knowledge"], // All sources
      {
        urban_dictionary: 1.0,
        wikipedia: 1.0,
        wordnet: 1.0,
        google_knowledge: 1.0,
      }
    );

    console.log(`Found ${result.totalCount} keywords with error handling:`);
    result.keywords.slice(0, 10).forEach((keyword, index) => {
      const sources = keyword.sources ? ` (${keyword.sources.join(", ")})` : "";
      console.log(
        `  ${index + 1}. "${keyword.word}" - ${(keyword.score * 100).toFixed(1)}%${sources}`
      );
    });

    return result;
  } catch (error) {
    console.error("Error in keyword extraction:", error);
    return { keywords: [], groupedKeywords: {}, totalCount: 0 };
  }
}

// Run all examples
export async function runAllDynamicDictionaryExamples() {
  console.log("🚀 [DYNAMIC DICTIONARIES] Running all examples...\n");

  try {
    await exampleUrbanDictionary();
    console.log(`\n${"=".repeat(60)}\n`);

    await exampleWikipediaReferences();
    console.log(`\n${"=".repeat(60)}\n`);

    await exampleWordNetTechnical();
    console.log(`\n${"=".repeat(60)}\n`);

    await exampleGoogleKnowledgeGraph();
    console.log(`\n${"=".repeat(60)}\n`);

    await exampleMultipleDynamicSources();
    console.log(`\n${"=".repeat(60)}\n`);

    await exampleCustomDynamicLoading();
    console.log(`\n${"=".repeat(60)}\n`);

    await exampleErrorHandling();
    console.log(`\n${"=".repeat(60)}\n`);

    console.log("✅ [DYNAMIC DICTIONARIES] All examples completed!");
  } catch (error) {
    console.error("❌ [DYNAMIC DICTIONARIES] Error running examples:", error);
  }
}

// Individual examples are already exported above
