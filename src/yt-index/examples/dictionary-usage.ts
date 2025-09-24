import {
  DICTIONARY_CONFIGS,
  type DictionaryConfig,
  extractKeywordsFromTranscript,
  loadDictionaries,
} from "../utils/keywords";

// Example 1: Using predefined dictionary configurations
export async function examplePredefinedDictionaries() {
  console.log("=== Example 1: Predefined Dictionary Configurations ===");

  const transcript = `
    In this React tutorial, we'll learn about JavaScript, TypeScript, and modern web development.
    We'll cover topics like state management, component lifecycle, and API integration.
    This is perfect for beginners who want to learn programming and software development.
  `;

  // Use programming dictionary
  const programmingResult = await extractKeywordsFromTranscript(
    transcript,
    DICTIONARY_CONFIGS.programming
  );
  console.log("Programming keywords:", programmingResult.keywords.slice(0, 5));

  // Use business dictionary
  const businessResult = await extractKeywordsFromTranscript(
    transcript,
    DICTIONARY_CONFIGS.business
  );
  console.log("Business keywords:", businessResult.keywords.slice(0, 5));

  // Use comprehensive dictionary
  const comprehensiveResult = await extractKeywordsFromTranscript(
    transcript,
    DICTIONARY_CONFIGS.comprehensive
  );
  console.log(
    "Comprehensive keywords:",
    comprehensiveResult.keywords.slice(0, 5)
  );
}

// Example 2: Creating custom inline dictionaries
export async function exampleCustomInlineDictionaries() {
  console.log("\n=== Example 2: Custom Inline Dictionaries ===");

  const transcript = `
    This gaming guide covers advanced strategies for competitive play.
    Learn about meta builds, character optimization, and tactical positioning.
    Perfect for experienced players looking to improve their gameplay.
  `;

  // Custom gaming dictionary with specific terms
  const customGamingConfig: DictionaryConfig = {
    dictionaries: [
      {
        type: "inline",
        terms: [
          "gaming",
          "guide",
          "strategies",
          "competitive",
          "play",
          "meta",
          "builds",
          "character",
          "optimization",
          "tactical",
          "positioning",
          "experienced",
          "players",
          "gameplay",
          "advanced",
          "tutorial",
          "tips",
          "tricks",
          "secrets",
        ],
        weight: 1.8, // Higher weight for custom terms
      },
    ],
  };

  const result = await extractKeywordsFromTranscript(
    transcript,
    customGamingConfig
  );
  console.log("Custom gaming keywords:", result.keywords.slice(0, 8));
  console.log("Dictionaries used:", result.dictionariesUsed);
}

// Example 3: Loading dictionaries from files
export async function exampleFileBasedDictionaries() {
  console.log("\n=== Example 3: File-Based Dictionaries ===");

  const transcript = `
    This machine learning course covers neural networks, deep learning, and AI algorithms.
    We'll use Python, TensorFlow, and PyTorch for hands-on projects.
    Topics include computer vision, natural language processing, and reinforcement learning.
  `;

  // Create a custom ML dictionary file
  const mlTerms = [
    "machine",
    "learning",
    "neural",
    "networks",
    "deep",
    "learning",
    "artificial",
    "intelligence",
    "algorithms",
    "python",
    "tensorflow",
    "pytorch",
    "computer",
    "vision",
    "natural",
    "language",
    "processing",
    "reinforcement",
    "learning",
    "data",
    "science",
    "statistics",
    "probability",
    "regression",
    "classification",
    "clustering",
    "supervised",
    "unsupervised",
    "training",
    "model",
  ].join("\n");

  // Note: In a real implementation, you'd write this to a file first
  // For this example, we'll use inline dictionaries instead
  const fileBasedConfig: DictionaryConfig = {
    dictionaries: [
      {
        type: "inline", // In practice, this would be "file" with path: "./dictionaries/ml-terms.txt"
        terms: mlTerms.split("\n"),
        weight: 1.6,
      },
    ],
  };

  const result = await extractKeywordsFromTranscript(
    transcript,
    fileBasedConfig
  );
  console.log("ML keywords from file:", result.keywords.slice(0, 8));
}

// Example 4: Multiple dictionary sources with different weights
export async function exampleMultipleDictionaries() {
  console.log(
    "\n=== Example 4: Multiple Dictionaries with Different Weights ==="
  );

  const transcript = `
    This comprehensive business strategy guide covers marketing automation, 
    customer acquisition, revenue optimization, and team leadership.
    Perfect for startup founders and business executives.
  `;

  const multiDictConfig: DictionaryConfig = {
    dictionaries: [
      {
        type: "inline",
        terms: [
          "business",
          "strategy",
          "guide",
          "comprehensive",
          "startup",
          "founders",
          "executives",
        ],
        weight: 2.0, // Highest priority
      },
      {
        type: "inline",
        terms: [
          "marketing",
          "automation",
          "customer",
          "acquisition",
          "revenue",
          "optimization",
        ],
        weight: 1.5, // Medium priority
      },
      {
        type: "inline",
        terms: [
          "team",
          "leadership",
          "management",
          "productivity",
          "efficiency",
        ],
        weight: 1.2, // Lower priority
      },
    ],
  };

  const result = await extractKeywordsFromTranscript(
    transcript,
    multiDictConfig
  );
  console.log("Multi-dictionary keywords:", result.keywords.slice(0, 10));

  // Show which dictionaries contributed to each keyword
  for (const keyword of result.keywords.slice(0, 5)) {
    if (keyword.sources) {
      console.log(
        `"${keyword.word}" boosted by: ${keyword.sources.join(", ")}`
      );
    }
  }
}

// Example 5: Domain-specific dictionary loading
export async function exampleDomainSpecificDictionaries() {
  console.log("\n=== Example 5: Domain-Specific Dictionary Loading ===");

  // Load multiple domain dictionaries
  const domainConfigs = [
    DICTIONARY_CONFIGS.programming,
    DICTIONARY_CONFIGS.business,
    DICTIONARY_CONFIGS.gaming,
  ];

  const allDictionaries = await Promise.all(
    domainConfigs.map((config) => loadDictionaries(config))
  );

  const combinedDictionaries = allDictionaries.flat();
  console.log(
    `Loaded ${combinedDictionaries.length} dictionaries with ${combinedDictionaries.reduce((sum, dict) => sum + dict.terms.size, 0)} total terms`
  );

  const transcript = `
    This React Native tutorial covers mobile app development, state management,
    and API integration. Perfect for developers building cross-platform applications.
  `;

  const result = await extractKeywordsFromTranscript(transcript, {
    dictionaries: [
      {
        type: "inline",
        terms: Array.from(
          combinedDictionaries.flatMap((dict) => Array.from(dict.terms))
        ),
        weight: 1.0,
      },
    ],
  });

  console.log("Domain-specific keywords:", result.keywords.slice(0, 8));
}

// Example 6: Creating a dictionary from external data
export async function exampleExternalDataDictionary() {
  console.log("\n=== Example 6: Dictionary from External Data ===");

  // Simulate loading data from an API or external source
  const externalTerms = [
    "blockchain",
    "cryptocurrency",
    "bitcoin",
    "ethereum",
    "defi",
    "nft",
    "web3",
    "smart",
    "contracts",
    "consensus",
    "mining",
    "staking",
    "yield",
    "farming",
    "trading",
    "portfolio",
    "investment",
    "volatility",
    "liquidity",
    "governance",
  ];

  const externalConfig: DictionaryConfig = {
    dictionaries: [
      {
        type: "inline",
        terms: externalTerms,
        weight: 1.7,
      },
    ],
  };

  const transcript = `
    This DeFi tutorial covers yield farming strategies, liquidity provision,
    and smart contract development. Learn about blockchain technology and
    cryptocurrency investment strategies.
  `;

  const result = await extractKeywordsFromTranscript(
    transcript,
    externalConfig
  );
  console.log("External data keywords:", result.keywords.slice(0, 8));
}

// Run all examples
export async function runAllDictionaryExamples() {
  try {
    await examplePredefinedDictionaries();
    await exampleCustomInlineDictionaries();
    await exampleFileBasedDictionaries();
    await exampleMultipleDictionaries();
    await exampleDomainSpecificDictionaries();
    await exampleExternalDataDictionary();
  } catch (error) {
    console.error("Error running dictionary examples:", error);
  }
}

// Individual examples are already exported above
