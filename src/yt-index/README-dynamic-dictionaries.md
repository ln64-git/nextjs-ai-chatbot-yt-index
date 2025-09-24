# 🌐 Dynamic Dictionary System

A powerful system for loading external dictionaries and cultural references dynamically based on transcript content, using free and paid APIs.

## 🚀 Features

- **Urban Dictionary API** - Slang, cultural terms, and modern language
- **Wikipedia API** - Cultural references, entities, and historical context
- **WordNet API** - Technical terms and formal vocabulary
- **Google Knowledge Graph** - Entity recognition and structured data
- **Rate limiting** - Built-in protection against API limits
- **Error handling** - Graceful fallbacks when APIs fail
- **Caching** - Efficient memory usage with dictionary caching
- **Configurable** - Easy to enable/disable specific APIs

## 📋 Prerequisites

### Free APIs (No API Key Required)
- ✅ **Urban Dictionary** - Ready to use
- ✅ **Wikipedia** - Ready to use

### Paid APIs (API Key Required)
- 🔑 **WordNet (WordNik)** - 1,000 requests/day free
- 🔑 **Google Knowledge Graph** - 100,000 requests/day free

## 🛠️ Setup

### 1. Install Dependencies
```bash
# No additional dependencies required - uses built-in fetch
```

### 2. Configure API Keys (Optional)
Create `src/yt-index/config/api-keys.local.ts`:

```typescript
export const API_KEYS = {
  wordnet: {
    enabled: true,
    apiKey: "your_wordnik_api_key_here",
  },
  google_knowledge: {
    enabled: true,
    apiKey: "your_google_api_key_here",
  },
};
```

### 3. Get API Keys

#### WordNet (WordNik)
1. Visit [WordNik](https://www.wordnik.com/)
2. Sign up for a free account
3. Go to account settings
4. Generate an API key
5. Add to environment: `WORDNIK_API_KEY=your_key`

#### Google Knowledge Graph
1. Visit [Google Knowledge Graph API](https://developers.google.com/knowledge-graph)
2. Create a new project
3. Enable the Knowledge Graph Search API
4. Create credentials (API key)
5. Add to environment: `GOOGLE_KNOWLEDGE_API_KEY=your_key`

## 🎯 Usage

### Basic Usage
```typescript
import { extractKeywordsFromTranscript } from "../utils/keywords";

const transcript = "That's totally lit! The Matrix was groundbreaking.";

const result = await extractKeywordsFromTranscript(
  transcript,
  undefined, // No static dictionaries
  ["urban_dictionary", "wikipedia"], // Use dynamic sources
  { urban_dictionary: 1.5, wikipedia: 1.2 } // Custom weights
);
```

### Advanced Usage
```typescript
import { 
  extractKeywordsFromTranscript, 
  loadDynamicDictionaries 
} from "../utils/keywords";

// Load dynamic dictionaries manually
const dynamicDictionaries = await loadDynamicDictionaries(
  transcript,
  ["urban_dictionary", "wikipedia", "wordnet"],
  { 
    urban_dictionary: 1.0,
    wikipedia: 1.5,
    wordnet: 2.0
  }
);

// Use in keyword extraction
const result = await extractKeywordsFromTranscript(
  transcript,
  staticDictionaryConfig,
  ["urban_dictionary", "wikipedia", "wordnet"],
  { urban_dictionary: 1.0, wikipedia: 1.5, wordnet: 2.0 }
);
```

## 🔧 Configuration

### API Settings
```typescript
const API_CONFIG = {
  urban_dictionary: { 
    enabled: true, 
    rateLimit: 100, 
    timeout: 5000 
  },
  wikipedia: { 
    enabled: true, 
    rateLimit: 200, 
    timeout: 3000 
  },
  wordnet: { 
    enabled: false, 
    apiKey: "YOUR_KEY", 
    rateLimit: 50, 
    timeout: 5000 
  },
  google_knowledge: { 
    enabled: false, 
    apiKey: "YOUR_KEY", 
    rateLimit: 30, 
    timeout: 5000 
  },
};
```

### Rate Limiting
- **Urban Dictionary**: 10 requests/minute
- **Wikipedia**: 20 requests/minute  
- **WordNet**: 5 requests/minute
- **Google Knowledge**: 3 requests/minute

## 📊 Examples

### 1. Cultural References
```typescript
const transcript = `
  The Mona Lisa is one of the most famous paintings in the world.
  It was painted by Leonardo da Vinci during the Italian Renaissance.
`;

const result = await extractKeywordsFromTranscript(
  transcript,
  undefined,
  ["wikipedia"], // Focus on cultural references
  { wikipedia: 2.0 }
);
// Will find: mona lisa, leonardo da vinci, italian renaissance, louvre, etc.
```

### 2. Slang & Modern Language
```typescript
const transcript = `
  Yo, that's totally lit! The party was absolutely banging last night.
  We were vibing hard to some sick beats. That DJ was straight fire!
`;

const result = await extractKeywordsFromTranscript(
  transcript,
  undefined,
  ["urban_dictionary"], // Focus on slang
  { urban_dictionary: 2.5 }
);
// Will find: lit, banging, vibing, sick, fire, etc.
```

### 3. Technical Terms
```typescript
const transcript = `
  The algorithm utilizes machine learning techniques to process
  natural language data. We implement neural networks with
  backpropagation to optimize the model parameters.
`;

const result = await extractKeywordsFromTranscript(
  transcript,
  undefined,
  ["wordnet"], // Focus on technical terms
  { wordnet: 2.0 }
);
// Will find: algorithm, machine learning, neural networks, backpropagation, etc.
```

### 4. Entity Recognition
```typescript
const transcript = `
  Apple Inc. is a multinational technology company headquartered in Cupertino.
  The company was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne.
`;

const result = await extractKeywordsFromTranscript(
  transcript,
  undefined,
  ["google_knowledge"], // Focus on entities
  { google_knowledge: 2.5 }
);
// Will find: apple inc, cupertino, steve jobs, steve wozniak, etc.
```

## 🎛️ API Reference

### `extractKeywordsFromTranscript()`
```typescript
extractKeywordsFromTranscript(
  transcript: string,
  dictionaryConfig?: DictionaryConfig,
  dynamicSources?: Array<"urban_dictionary" | "wikipedia" | "wordnet" | "google_knowledge">,
  dynamicWeights?: Record<string, number>
): Promise<KeywordExtractionResult>
```

### `loadDynamicDictionaries()`
```typescript
loadDynamicDictionaries(
  transcript: string,
  sources: Array<"urban_dictionary" | "wikipedia" | "wordnet" | "google_knowledge">,
  weights: Record<string, number> = {}
): Promise<Dictionary[]>
```

## 🚨 Error Handling

The system includes comprehensive error handling:

- **API Failures**: Graceful fallback to other sources
- **Rate Limiting**: Automatic request throttling
- **Timeouts**: Configurable request timeouts
- **Network Issues**: Retry logic with exponential backoff
- **Invalid Responses**: Data validation and sanitization

## 📈 Performance

### Caching
- Dictionaries are cached in memory
- Cache duration: 24 hours
- Maximum cache size: 1,000 entries
- Automatic cleanup every hour

### Rate Limiting
- Per-API rate limiting
- Global concurrent request limiting
- Request delay between calls
- Automatic retry with backoff

### Memory Usage
- Efficient Set-based storage
- Automatic garbage collection
- Configurable cache limits
- Memory leak prevention

## 🔒 Security

### API Key Management
- Environment variable support
- Local configuration files
- Never commit keys to version control
- Secure key rotation

### Rate Limiting
- Prevents API abuse
- Protects against DoS attacks
- Fair usage policies
- Cost control

## 🧪 Testing

### Run Examples
```bash
# Test all dynamic dictionary examples
node -e "
import('./src/yt-index/examples/dynamic-dictionary-usage.ts')
  .then(module => module.runAllDynamicDictionaryExamples())
  .catch(console.error);
"
```

### Test Individual APIs
```bash
# Test Urban Dictionary
node -e "
import('./src/yt-index/examples/dynamic-dictionary-usage.ts')
  .then(module => module.exampleUrbanDictionary())
  .catch(console.error);
"
```

## 🐛 Troubleshooting

### Common Issues

#### API Key Errors
```
Error: Invalid API key for WordNet
```
**Solution**: Check your API key configuration and ensure it's valid.

#### Rate Limit Exceeded
```
Warning: Rate limit exceeded for Urban Dictionary
```
**Solution**: Wait for the rate limit to reset or reduce request frequency.

#### Network Timeouts
```
Warning: Request timeout for Wikipedia
```
**Solution**: Check your internet connection or increase timeout values.

#### No Keywords Found
```
Found 0 keywords with dynamic dictionaries
```
**Solution**: Check if the APIs are enabled and the transcript contains relevant terms.

### Debug Mode
Enable debug logging by setting:
```typescript
const DEBUG = true; // In your configuration
```

## 📚 Additional Resources

- [Urban Dictionary API](https://api.urbandictionary.com/)
- [Wikipedia API](https://en.wikipedia.org/api/rest_v1/)
- [WordNik API](https://www.wordnik.com/)
- [Google Knowledge Graph API](https://developers.google.com/knowledge-graph)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Happy keyword extracting! 🎉**
