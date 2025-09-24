import { Task } from './planner-agent';

export interface CodeGenerationResult {
  code: string;
  filename: string;
  description: string;
  prUrl?: string;
}

export interface CoderConfig {
  geminiApiKey?: string;
  githubToken?: string;
  githubOwner?: string;
  githubRepo?: string;
}

// Fallback code generation function
const createFallbackCode = (task: Task): CodeGenerationResult => {
  const templates = {
    api: `
// ${task.title}
// ${task.description}

export async function handler(req: any, res: any) {
  try {
    // TODO: Implement ${task.title}
    res.json({ message: 'Implementation needed for: ${task.title}' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
    `,
    component: `
// ${task.title}
// ${task.description}

import React from 'react';

interface Props {
  // TODO: Define props for ${task.title}
}

export default function Component({ }: Props) {
  return (
    <div>
      <h2>${task.title}</h2>
      <p>{/* TODO: Implement ${task.title} */}</p>
    </div>
  );
}
    `,
    utility: `
// ${task.title}
// ${task.description}

/**
 * TODO: Implement ${task.title}
 */
export function implementTask() {
  // Implementation needed for: ${task.description}
  throw new Error('Not implemented: ${task.title}');
}
    `
  };

  const type = task.metadata?.type || 'utility';
  const template = templates[type as keyof typeof templates] || templates.utility;

  return {
    code: template,
    filename: `${task.title.toLowerCase().replace(/\s+/g, '-')}.ts`,
    description: `Fallback implementation template for: ${task.title}`
  };
};

// GitHub PR creation function
const createGitHubPR = async (
  codeResult: CodeGenerationResult, 
  task: Task, 
  config: CoderConfig
): Promise<string | undefined> => {
  try {
    if (!config.githubToken || !config.githubOwner || !config.githubRepo) {
      return undefined;
    }

    // Dynamic import to avoid dependency issues
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({ auth: config.githubToken });

    const owner = config.githubOwner;
    const repo = config.githubRepo;
    const branchName = `feature/task-${task.id}-${Date.now()}`;

    // Create branch
    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: 'heads/main'
    });

    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha
    });

    // Create file
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: `generated/${codeResult.filename}`,
      message: `feat: ${task.title}`,
      content: Buffer.from(codeResult.code).toString('base64'),
      branch: branchName
    });

    // Create PR
    const { data: pr } = await octokit.rest.pulls.create({
      owner,
      repo,
      title: `🤖 ${task.title}`,
      head: branchName,
      base: 'main',
      body: `
## 🤖 AI-Generated Code

**Task**: ${task.title}
**Description**: ${task.description}

**Generated Code**: \`${codeResult.filename}\`

${codeResult.description}

---
*This PR was automatically created by AI Hack Mate*
      `
    });

    return pr.html_url;
  } catch (error) {
    console.error('Failed to create GitHub PR:', (error as Error).message);
    return undefined;
  }
};

// AI-powered code generation function
const createAICode = async (task: Task, config: CoderConfig): Promise<CodeGenerationResult> => {
  try {
    console.log('🤖 AI Code Generation Starting...', {
      hasApiKey: !!config.geminiApiKey,
      taskTitle: task.title,
      apiKeyPrefix: config.geminiApiKey?.substring(0, 10) + '...'
    });
    
    if (!config.geminiApiKey) {
      console.log('❌ No Gemini API key provided, using fallback');
      return createFallbackCode(task);
    }

    // Dynamic import to avoid dependency issues
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
      As a senior software developer, implement this task:
      
      Title: ${task.title}
      Description: ${task.description}
      
      Generate production-ready code that:
      1. Follows best practices and modern patterns
      2. Includes proper error handling
      3. Is well-documented with comments
      4. Uses TypeScript when applicable
      5. Follows the existing project structure
      
      Return your response in this EXACT format with three sections separated by |||:
      
      FILENAME|||your-file-name.js|||
      DESCRIPTION|||Brief description of what the code does|||
      CODE|||
      // Your actual code here
      // Can be multiple lines
      // No escaping needed
      |||END
      
      Example:
      FILENAME|||calculator.js|||
      DESCRIPTION|||A simple calculator function|||
      CODE|||
      function add(a, b) {
        return a + b;
      }
      |||END
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the custom format response (no JSON parsing needed!)
    console.log('🔍 Raw AI Response:', text.substring(0, 200) + '...');
    
    let parsed;
    try {
      // First try the new simple format
      const filenameMatch = text.match(/FILENAME\|\|\|(.*?)\|\|\|/);
      const descMatch = text.match(/DESCRIPTION\|\|\|(.*?)\|\|\|/);
      const codeMatch = text.match(/CODE\|\|\|([\s\S]*?)\|\|\|END/);
      
      if (filenameMatch && descMatch && codeMatch) {
        parsed = {
          filename: filenameMatch[1].trim(),
          code: codeMatch[1].trim(),
          description: descMatch[1].trim()
        };
        console.log('✅ Successfully parsed custom format');
      } else {
        // Fallback to JSON parsing if AI didn't follow the format
        console.log('⚠️ Custom format not found, trying JSON...');
        
        // Remove markdown blocks
        let jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
            console.log('✅ JSON parsed successfully');
          } catch (e) {
            // Last resort: extract fields manually
            const fnMatch = jsonStr.match(/"filename":\s*"([^"]*?)"/);
            const descMatch = jsonStr.match(/"description":\s*"([^"]*?)"/);
            const codeMatch = jsonStr.match(/"code":\s*"([\s\S]*?)"/);
            
            if (fnMatch && descMatch && codeMatch) {
              parsed = {
                filename: fnMatch[1],
                code: codeMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
                description: descMatch[1]
              };
              console.log('✅ Manually extracted from JSON');
            } else {
              throw new Error('Could not parse response in any format');
            }
          }
        } else {
          throw new Error('No parseable content found');
        }
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw error;
    }
    
    // Create GitHub PR if configured
    let prUrl;
    if (config.githubToken && config.githubOwner && config.githubRepo) {
      prUrl = await createGitHubPR(parsed, task, config);
    }

    return {
      code: parsed.code || '',
      filename: parsed.filename || 'generated-code.js',
      description: parsed.description || 'AI-generated code',
      prUrl
    };
  } catch (error) {
    console.warn('AI code generation failed, using fallback:', (error as Error).message);
    const fallbackResult = createFallbackCode(task);
    
    // Create GitHub PR even with fallback code
    let prUrl: string | undefined;
    if (config.githubToken && config.githubOwner && config.githubRepo) {
      console.log('🚀 Creating GitHub PR with fallback code...');
      prUrl = await createGitHubPR(fallbackResult, task, config);
    }
    
    return {
      ...fallbackResult,
      prUrl
    };
  }
};

// Main code execution function
export const executeCoderTask = async (task: Task, config?: CoderConfig): Promise<CodeGenerationResult> => {
  try {
    const finalConfig: CoderConfig = {
      geminiApiKey: config?.geminiApiKey || process.env.GEMINI_API_KEY,
      githubToken: config?.githubToken || process.env.GITHUB_TOKEN,
      githubOwner: config?.githubOwner || process.env.GITHUB_OWNER,
      githubRepo: config?.githubRepo || process.env.GITHUB_REPO,
      ...config
    };

    if (finalConfig.geminiApiKey) {
      return await createAICode(task, finalConfig);
    }
    
    return createFallbackCode(task);
  } catch (error) {
    console.error('Coder execution error:', (error as Error).message);
    return createFallbackCode(task);
  }
};

// Get coder status
export const getCoderStatus = (config?: CoderConfig) => {
  const finalConfig = {
    geminiApiKey: config?.geminiApiKey || process.env.GEMINI_API_KEY,
    githubToken: config?.githubToken || process.env.GITHUB_TOKEN,
    githubOwner: config?.githubOwner || process.env.GITHUB_OWNER,
    githubRepo: config?.githubRepo || process.env.GITHUB_REPO,
    ...config
  };

  return {
    name: 'Coder Agent',
    status: 'ready',
    capabilities: ['code_generation', 'github_integration'],
    aiEnabled: !!finalConfig.geminiApiKey,
    githubEnabled: !!(finalConfig.githubToken && finalConfig.githubOwner && finalConfig.githubRepo)
  };
};
