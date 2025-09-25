// ============================================================================
// SHARED TEST UTILITIES
// ============================================================================


// Helper function to execute the tool and get the result
export async function executeTool(toolInstance: any, params: any) {
  const result = await toolInstance.execute(params);
  // Handle AsyncIterable result
  if (result && typeof result[Symbol.asyncIterator] === 'function') {
    const iterator = result[Symbol.asyncIterator]();
    const { value } = await iterator.next();
    return value;
  }
  return result;
}

// ============================================================================
// TEST DATA
// ============================================================================

export const TEST_VIDEOS = {
  SHORT_WITH_TRANSCRIPT: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Rick Roll
  LONG_WITH_TRANSCRIPT: "https://www.youtube.com/watch?v=IOV06O5PkAE", // Manly P Hall
  NO_TRANSCRIPT: "https://www.youtube.com/watch?v=00000000000", // Non-existent
  INVALID_URL: "https://www.youtube.com/watch?v=invalid123",
  VALID_URLS: [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "http://www.youtube.com/watch?v=dQw4w9WgXcQ",
  ],
  INVALID_URLS: [
    "https://www.google.com",
    "https://www.youtube.com",
    "https://www.youtube.com/watch",
    "https://www.youtube.com/watch?v=",
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/watch?v=thisiswaytoolongtobeavideoid",
    "not-a-url",
    "",
    null as any,
    undefined as any,
  ],
};

export const SAMPLE_TRANSCRIPTS = {
  SHORT: "Hello world, this is a test video about programming and software development.",
  TECHNICAL: "In this tutorial, we'll cover React hooks, TypeScript, and modern web development practices. We'll use Node.js, Express, and MongoDB for the backend.",
  LONG: "Welcome to our comprehensive guide on machine learning and artificial intelligence. Today we'll discuss neural networks, deep learning, computer vision, natural language processing, and data science. We'll cover Python programming, TensorFlow, PyTorch, scikit-learn, and various algorithms including supervised learning, unsupervised learning, and reinforcement learning.",
  MIXED: "The weather today is sunny with a temperature of 75 degrees. We're discussing climate change, global warming, and environmental sustainability. The United Nations has released a new report on carbon emissions.",
  SIMPLE: "Hello world. This is a test. How are you today?",
  COMPLEX: "Welcome to our tutorial. First, we'll cover the basics. Then, we'll move to advanced topics. Finally, we'll wrap up with a summary.",
  WITH_COMMAS: "In this video, we'll discuss programming, software development, and best practices. We'll cover React, TypeScript, and modern web development.",
  EMPTY: "",
  SINGLE_SENTENCE: "This is a single sentence without punctuation",
  MULTIPLE_PUNCTUATION: "Hello!!! How are you??? I'm fine... What about you?!",
};
