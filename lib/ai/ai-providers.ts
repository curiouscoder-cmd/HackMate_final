export interface AIProvider {
  name: string;
  id: string;
  capabilities: string[];
  costPerToken: {
    input: number;
    output: number;
  };
  maxTokens: number;
  bestFor: string[];
}

export interface AIResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
  };
  cost: number;
  model: string;
  provider: string;
}

export const AI_PROVIDERS: Record<string, AIProvider> = {
  'gemini-pro': {
    name: 'Google Gemini Pro',
    id: 'gemini-pro',
    capabilities: ['text-generation', 'code-generation', 'analysis'],
    costPerToken: { input: 0.000125, output: 0.000375 },
    maxTokens: 30720,
    bestFor: ['general-tasks', 'code-generation', 'analysis']
  },
  'gpt-4': {
    name: 'OpenAI GPT-4',
    id: 'gpt-4',
    capabilities: ['text-generation', 'code-generation', 'reasoning'],
    costPerToken: { input: 0.03, output: 0.06 },
    maxTokens: 8192,
    bestFor: ['complex-reasoning', 'code-review', 'planning']
  },
  'gpt-4-turbo': {
    name: 'OpenAI GPT-4 Turbo',
    id: 'gpt-4-turbo',
    capabilities: ['text-generation', 'code-generation', 'reasoning', 'vision'],
    costPerToken: { input: 0.01, output: 0.03 },
    maxTokens: 128000,
    bestFor: ['large-context', 'complex-tasks', 'code-generation']
  },
  'claude-3-opus': {
    name: 'Anthropic Claude 3 Opus',
    id: 'claude-3-opus',
    capabilities: ['text-generation', 'code-generation', 'analysis', 'reasoning'],
    costPerToken: { input: 0.015, output: 0.075 },
    maxTokens: 200000,
    bestFor: ['complex-analysis', 'long-context', 'creative-tasks']
  },
  'claude-3-sonnet': {
    name: 'Anthropic Claude 3 Sonnet',
    id: 'claude-3-sonnet',
    capabilities: ['text-generation', 'code-generation', 'analysis'],
    costPerToken: { input: 0.003, output: 0.015 },
    maxTokens: 200000,
    bestFor: ['balanced-performance', 'code-generation', 'analysis']
  }
};

export const TASK_TYPE_MODEL_MAPPING: Record<string, string[]> = {
  'planning': ['gpt-4', 'claude-3-opus', 'gemini-pro'],
  'code-generation': ['gpt-4-turbo', 'claude-3-sonnet', 'gemini-pro'],
  'debugging': ['gpt-4', 'claude-3-sonnet', 'gemini-pro'],
  'analysis': ['claude-3-opus', 'gpt-4', 'gemini-pro'],
  'documentation': ['claude-3-sonnet', 'gpt-4-turbo', 'gemini-pro'],
  'testing': ['gpt-4', 'claude-3-sonnet', 'gemini-pro']
};

export function selectBestModel(taskType: string, complexity: 'low' | 'medium' | 'high'): string {
  const candidates = TASK_TYPE_MODEL_MAPPING[taskType] || ['gemini-pro'];
  
  if (complexity === 'high') {
    return candidates[0]; // Best model for complex tasks
  } else if (complexity === 'medium') {
    return candidates[1] || candidates[0]; // Balanced model
  } else {
    return candidates[2] || candidates[0]; // Cost-effective model
  }
}

export function calculateCost(tokensUsed: { input: number; output: number }, modelId: string): number {
  const provider = AI_PROVIDERS[modelId];
  if (!provider) return 0;
  
  return (tokensUsed.input * provider.costPerToken.input) + 
         (tokensUsed.output * provider.costPerToken.output);
}
