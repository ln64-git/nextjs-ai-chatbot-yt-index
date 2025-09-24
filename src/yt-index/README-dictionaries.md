# External Dictionary Support for Keyword Extraction

This document explains how to use external dictionaries to improve keyword extraction accuracy in the YouTube video analysis system.

## Overview

The keyword extraction system now supports external dictionaries that can boost the relevance scores of specific terms. This is particularly useful for:

- **Domain-specific content**: Technical tutorials, business content, gaming videos
- **Custom terminology**: Company-specific terms, product names, specialized vocabulary
- **Multi-language support**: Terms in different languages or dialects
- **Dynamic content**: Terms that change over time or by context

## Dictionary Types

### 1. Inline Dictionaries
Predefined terms embedded directly in the configuration:

```typescript
const config: DictionaryConfig = {
  dictionaries: [
    {
      type: "inline",
      terms: ["javascript", "typescript", "react", "tutorial", "programming"],
      weight: 1.5
    }
  ]
};
```

### 2. File-based Dictionaries
Load terms from text files (one term per line):

```typescript
const config: DictionaryConfig = {
  dictionaries: [
    {
      type: "file",
      path: "./dictionaries/technical-terms.txt",
      weight: 1.2
    }
  ]
};
```

### 3. URL-based Dictionaries (Planned)
Load terms from remote URLs:

```typescript
const config: DictionaryConfig = {
  dictionaries: [
    {
      type: "url",
      url: "https://api.example.com/terms",
      weight: 1.0
    }
  ]
};
```

### 4. API-based Dictionaries (Planned)
Load terms from API endpoints:

```typescript
const config: DictionaryConfig = {
  dictionaries: [
    {
      type: "api",
      endpoint: "https://api.example.com/v1/terms",
      weight: 1.0
    }
  ]
};
```

## Predefined Dictionary Configurations

### Programming Dictionary
Technical terms for software development content:

```typescript
import { DICTIONARY_CONFIGS } from "../utils/keywords";

const result = await extractKeywordsFromTranscript(
  transcript, 
  DICTIONARY_CONFIGS.programming
);
```

**Includes**: JavaScript, TypeScript, Python, React, Node.js, APIs, databases, DevOps tools, testing frameworks, etc.

### Business Dictionary
Terms for business and entrepreneurship content:

```typescript
const result = await extractKeywordsFromTranscript(
  transcript, 
  DICTIONARY_CONFIGS.business
);
```

**Includes**: Revenue, profit, marketing, sales, startup, investment, leadership, strategy, etc.

### Gaming Dictionary
Terms for gaming and entertainment content:

```typescript
const result = await extractKeywordsFromTranscript(
  transcript, 
  DICTIONARY_CONFIGS.gaming
);
```

**Includes**: Gameplay, mechanics, strategy, quest, level, character, multiplayer, streaming, etc.

### Comprehensive Dictionary
Combined dictionary with terms from all domains:

```typescript
const result = await extractKeywordsFromTranscript(
  transcript, 
  DICTIONARY_CONFIGS.comprehensive
);
```

## Usage Examples

### Basic Usage
```typescript
import { extractKeywordsFromTranscript, DICTIONARY_CONFIGS } from "../utils/keywords";

// Use predefined dictionary
const result = await extractKeywordsFromTranscript(
  transcript, 
  DICTIONARY_CONFIGS.programming
);

console.log("Keywords:", result.keywords);
console.log("Dictionaries used:", result.dictionariesUsed);
```

### Custom Dictionary
```typescript
const customConfig: DictionaryConfig = {
  dictionaries: [
    {
      type: "inline",
      terms: [
        "machine", "learning", "neural", "networks", "deep", "learning",
        "artificial", "intelligence", "tensorflow", "pytorch"
      ],
      weight: 1.8
    }
  ]
};

const result = await extractKeywordsFromTranscript(transcript, customConfig);
```

### Multiple Dictionaries
```typescript
const multiConfig: DictionaryConfig = {
  dictionaries: [
    {
      type: "inline",
      terms: ["business", "strategy", "marketing"],
      weight: 2.0 // Highest priority
    },
    {
      type: "file",
      path: "./dictionaries/technical-terms.txt",
      weight: 1.5 // Medium priority
    },
    {
      type: "inline",
      terms: ["tutorial", "guide", "tips"],
      weight: 1.2 // Lower priority
    }
  ]
};
```

### File-based Dictionary
Create a text file with terms (one per line):

```
javascript
typescript
react
nodejs
api
database
tutorial
programming
development
```

Then load it:

```typescript
const config: DictionaryConfig = {
  dictionaries: [
    {
      type: "file",
      path: "./dictionaries/programming-terms.txt",
      weight: 1.5
    }
  ]
};
```

## Dictionary Weight System

Each dictionary has a weight that determines how much it boosts keyword scores:

- **Weight 1.0**: Standard boost
- **Weight 1.5**: 50% additional boost
- **Weight 2.0**: 100% additional boost (double)
- **Weight 0.5**: Reduced boost

### Scoring Formula
```
final_score = base_score + (dictionary_weight * 0.4)
```

For NER entities:
```
final_score = base_score + (dictionary_weight * 0.3)
```

## Source Tracking

Keywords now include source information showing which dictionaries contributed:

```typescript
interface Keyword {
  word: string;
  entity: string;
  score: number;
  sources?: string[]; // Which dictionaries boosted this keyword
}
```

Example output:
```typescript
{
  word: "JavaScript",
  entity: "KEYWORD",
  score: 0.85,
  sources: ["Programming Dictionary", "Comprehensive Dictionary"]
}
```

## Integration with YouTube Tools

The YouTube transcript tool automatically uses the comprehensive dictionary:

```typescript
// In fetch-youtube-transcript.ts
keywords = await extractKeywordsFromTranscript(
  result.transcript, 
  DICTIONARY_CONFIGS.comprehensive
);
```

## Performance Considerations

- **Caching**: Dictionaries are cached after first load
- **Memory**: Each dictionary is stored as a Set for fast lookups
- **Loading**: File-based dictionaries are loaded synchronously
- **Scoring**: Dictionary lookups are O(1) for each word

## Best Practices

1. **Use appropriate weights**: Higher weights for more important terms
2. **Combine dictionaries**: Use multiple dictionaries for comprehensive coverage
3. **File organization**: Keep dictionary files in a dedicated directory
4. **Term quality**: Use lowercase, trimmed terms without special characters
5. **Testing**: Test with sample transcripts to validate dictionary effectiveness

## Error Handling

The system gracefully handles dictionary loading errors:

- **File not found**: Returns empty dictionary with weight 0
- **Invalid format**: Logs warning and continues with other dictionaries
- **Network errors**: For URL/API dictionaries, logs warning and continues
- **Malformed terms**: Filters out invalid terms automatically

## Future Enhancements

- **Dynamic loading**: Load dictionaries from APIs in real-time
- **Language detection**: Automatically select appropriate dictionaries
- **Machine learning**: Learn from user feedback to improve dictionary weights
- **Collaborative dictionaries**: Share dictionaries across users
- **Version control**: Track dictionary changes over time

## Troubleshooting

### No keywords found
- Check if dictionary terms match transcript content
- Verify dictionary weight is not too low
- Ensure terms are in lowercase

### Poor keyword quality
- Adjust dictionary weights
- Add more relevant terms
- Use multiple specialized dictionaries

### Performance issues
- Reduce dictionary size
- Use file-based dictionaries for large term sets
- Consider caching strategies

## Examples

See `src/yt-index/examples/dictionary-usage.ts` for comprehensive examples of all dictionary features.
