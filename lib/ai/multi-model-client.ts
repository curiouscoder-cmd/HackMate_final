import { AIResponse, AI_PROVIDERS, selectBestModel, calculateCost } from './ai-providers';

export interface AIRequest {
  prompt: string;
  taskType: string;
  complexity: 'low' | 'medium' | 'high';
  preferredModel?: string;
  maxTokens?: number;
}

// Global client instances
let geminiClient: any = null;
let openaiClient: any = null;
let anthropicClient: any = null;
let clientsInitialized = false;

async function initializeClients() {
  if (clientsInitialized) return;

  // Initialize Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    } catch (error) {
      console.warn('Gemini client initialization failed:', error);
    }
  }

  // Initialize OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      const { OpenAI } = await import('openai');
      openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } catch (error) {
      console.warn('OpenAI client initialization failed:', error);
    }
  }

  // Initialize Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { Anthropic } = await import('@anthropic-ai/sdk');
      anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    } catch (error) {
      console.warn('Anthropic client initialization failed:', error);
    }
  }

  clientsInitialized = true;
}

export async function generateAIResponse(request: AIRequest): Promise<AIResponse> {
  await initializeClients();
  
  const modelId = request.preferredModel || selectBestModel(request.taskType, request.complexity);
  const provider = AI_PROVIDERS[modelId];

  if (!provider) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  try {
    if (modelId.startsWith('gemini')) {
      return await callGemini(request, modelId);
    } else if (modelId.startsWith('gpt')) {
      return await callOpenAI(request, modelId);
    } else if (modelId.startsWith('claude')) {
      return await callAnthropic(request, modelId);
    } else {
      throw new Error(`Unsupported model: ${modelId}`);
    }
  } catch (error) {
    console.error(`Error with ${modelId}:`, error);
    // Fallback to Gemini if available
    if (modelId !== 'gemini-pro' && geminiClient) {
      return await callGemini(request, 'gemini-pro');
    }
    throw error;
  }
}

async function callGemini(request: AIRequest, modelId: string): Promise<AIResponse> {
  if (!geminiClient) {
    throw new Error('Gemini client not initialized');
  }

  const model = geminiClient.getGenerativeModel({ model: modelId });
  const result = await model.generateContent(request.prompt);
  const response = await result.response;
  const text = response.text();

  // Estimate token usage (Gemini doesn't provide exact counts)
  const estimatedInputTokens = Math.ceil(request.prompt.length / 4);
  const estimatedOutputTokens = Math.ceil(text.length / 4);

  const tokensUsed = {
    input: estimatedInputTokens,
    output: estimatedOutputTokens
  };

  return {
    content: text,
    tokensUsed,
    cost: calculateCost(tokensUsed, modelId),
    model: modelId,
    provider: 'google'
  };
}

async function callOpenAI(request: AIRequest, modelId: string): Promise<AIResponse> {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized');
  }

  const completion = await openaiClient.chat.completions.create({
    model: modelId,
    messages: [{ role: 'user', content: request.prompt }],
    max_tokens: request.maxTokens || 4000,
  });

  const content = completion.choices[0]?.message?.content || '';
  const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0 };

  const tokensUsed = {
    input: usage.prompt_tokens,
    output: usage.completion_tokens
  };

  return {
    content,
    tokensUsed,
    cost: calculateCost(tokensUsed, modelId),
    model: modelId,
    provider: 'openai'
  };
}

async function callAnthropic(request: AIRequest, modelId: string): Promise<AIResponse> {
  if (!anthropicClient) {
    throw new Error('Anthropic client not initialized');
  }

  const message = await anthropicClient.messages.create({
    model: modelId,
    max_tokens: request.maxTokens || 4000,
    messages: [{ role: 'user', content: request.prompt }],
  });

  const content = message.content[0]?.type === 'text' ? message.content[0].text : '';
  
  const tokensUsed = {
    input: message.usage.input_tokens,
    output: message.usage.output_tokens
  };

  return {
    content,
    tokensUsed,
    cost: calculateCost(tokensUsed, modelId),
    model: modelId,
    provider: 'anthropic'
  };
}

export function getAvailableModels(): string[] {
  const available = [];
  
  if (geminiClient) available.push('gemini-pro');
  if (openaiClient) available.push('gpt-4', 'gpt-4-turbo');
  if (anthropicClient) available.push('claude-3-opus', 'claude-3-sonnet');
  
  return available;
}

export function getModelRecommendation(taskType: string, complexity: 'low' | 'medium' | 'high'): {
  recommended: string;
  alternatives: string[];
  reasoning: string;
} {
  const recommended = selectBestModel(taskType, complexity);
  const allOptions = TASK_TYPE_MODEL_MAPPING[taskType] || ['gemini-pro'];
  const alternatives = allOptions.filter(model => model !== recommended);
  
  const provider = AI_PROVIDERS[recommended];
  const reasoning = `${provider?.name} is recommended for ${taskType} tasks with ${complexity} complexity due to its ${provider?.bestFor.join(', ')} capabilities.`;
  
  return {
    recommended,
    alternatives,
    reasoning
  };
}

export function estimateCost(prompt: string, expectedOutputLength: number, modelId: string): number {
  const provider = AI_PROVIDERS[modelId];
  if (!provider) return 0;
  
  const inputTokens = Math.ceil(prompt.length / 4);
  const outputTokens = Math.ceil(expectedOutputLength / 4);
  
  return calculateCost({ input: inputTokens, output: outputTokens }, modelId);
}

// Import the TASK_TYPE_MODEL_MAPPING for use in recommendations
const TASK_TYPE_MODEL_MAPPING: Record<string, string[]> = {
  'planning': ['gpt-4', 'claude-3-opus', 'gemini-pro'],
  'code-generation': ['gpt-4-turbo', 'claude-3-sonnet', 'gemini-pro'],
  'debugging': ['gpt-4', 'claude-3-sonnet', 'gemini-pro'],
  'analysis': ['claude-3-opus', 'gpt-4', 'gemini-pro'],
  'documentation': ['claude-3-sonnet', 'gpt-4-turbo', 'gemini-pro'],
  'testing': ['gpt-4', 'claude-3-sonnet', 'gemini-pro']
};
