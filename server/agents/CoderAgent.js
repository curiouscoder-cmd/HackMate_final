const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises;
const path = require('path');

class CoderAgent {
  constructor(memoryManager) {
    this.memoryManager = memoryManager;
    this.status = 'idle';
    this.genAI = null;
    this.model = null;
    this.octokit = null;
  }

  async initialize() {
    try {
      // Initialize Gemini for code generation
      if (process.env.GEMINI_API_KEY) {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      }

      // Initialize GitHub integration
      if (process.env.GITHUB_TOKEN) {
        this.octokit = new Octokit({
          auth: process.env.GITHUB_TOKEN,
        });
      }

      console.log('✅ Coder Agent initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Coder Agent:', error);
      throw error;
    }
  }

  async execute(task) {
    this.status = 'working';
    
    try {
      const logs = ['Starting code generation task'];
      
      // Store task context
      await this.memoryManager.storeTaskContext(task.id, {
        task: task.title,
        description: task.description,
        agent: 'coder',
        startTime: Date.now()
      });

      // Generate code based on task description
      const codeResult = await this.generateCode(task);
      logs.push('Code generation completed');

      // Write code to files
      const filePaths = await this.writeCodeToFiles(codeResult.files);
      logs.push(`Created ${filePaths.length} files`);

      // Create GitHub branch and PR if configured
      let prUrl = null;
      if (this.octokit && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
        try {
          prUrl = await this.createPullRequest(task, codeResult, filePaths);
          logs.push(`Created pull request: ${prUrl}`);
        } catch (error) {
          logs.push(`Failed to create PR: ${error.message}`);
        }
      } else {
        logs.push('GitHub integration not configured, skipping PR creation');
      }

      // Store generated code in memory
      await this.memoryManager.storeCodeGeneration(
        task.id,
        JSON.stringify(codeResult.files),
        'javascript'
      );

      this.status = 'idle';

      return {
        success: true,
        logs,
        metadata: {
          filesCreated: filePaths,
          prUrl,
          codeGenerated: true
        }
      };
    } catch (error) {
      this.status = 'idle';
      throw error;
    }
  }

  async generateCode(task) {
    if (!this.model) {
      return this.generateMockCode(task);
    }

    try {
      const prompt = `
You are an expert software developer. Generate production-ready code for this task:

Task: ${task.title}
Description: ${task.description}

Requirements:
1. Generate complete, runnable code
2. Include proper error handling
3. Add comments for clarity
4. Follow best practices
5. Include necessary imports/dependencies

Return a JSON object with this structure:
{
  "files": [
    {
      "path": "relative/path/to/file.js",
      "content": "// Complete file content here",
      "description": "What this file does"
    }
  ],
  "summary": "Brief description of what was implemented"
}

Focus on creating clean, maintainable code that solves the specific requirements.
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse code generation response');
      }
    } catch (error) {
      console.error('Error generating code with Gemini:', error);
      return this.generateMockCode(task);
    }
  }

  generateMockCode(task) {
    const taskLower = task.description.toLowerCase();
    
    if (taskLower.includes('health') && taskLower.includes('endpoint')) {
      return {
        files: [
          {
            path: 'routes/health.js',
            content: `const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };

  try {
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.status = 'ERROR';
    healthCheck.error = error.message;
    res.status(503).json(healthCheck);
  }
});

module.exports = router;`,
            description: 'Health check endpoint that returns server status'
          },
          {
            path: 'tests/health.test.js',
            content: `const request = require('supertest');
const app = require('../app');

describe('Health Endpoint', () => {
  test('GET /health should return 200 and health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });

  test('Health response should include required fields', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    const requiredFields = ['status', 'timestamp', 'uptime', 'environment'];
    requiredFields.forEach(field => {
      expect(response.body).toHaveProperty(field);
    });
  });
});`,
            description: 'Unit tests for the health endpoint'
          }
        ],
        summary: 'Implemented /health endpoint with comprehensive status reporting and tests'
      };
    } else if (taskLower.includes('component') || taskLower.includes('ui')) {
      return {
        files: [
          {
            path: 'components/CustomComponent.tsx',
            content: `import React, { useState } from 'react';

interface CustomComponentProps {
  title?: string;
  onAction?: () => void;
}

const CustomComponent: React.FC<CustomComponentProps> = ({ 
  title = 'Custom Component', 
  onAction 
}) => {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    setIsActive(!isActive);
    if (onAction) {
      onAction();
    }
  };

  return (
    <div className={\`p-4 rounded-lg border \${isActive ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}\`}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <button
        onClick={handleClick}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        {isActive ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  );
};

export default CustomComponent;`,
            description: 'Reusable React component with TypeScript and Tailwind CSS'
          }
        ],
        summary: 'Created a responsive React component with interactive functionality'
      };
    } else {
      return {
        files: [
          {
            path: 'implementation.js',
            content: `// Implementation for: ${task.title}
// Description: ${task.description}

class Implementation {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    try {
      // Initialize implementation
      this.initialized = true;
      console.log('Implementation initialized successfully');
    } catch (error) {
      console.error('Failed to initialize:', error);
      throw error;
    }
  }

  async execute() {
    if (!this.initialized) {
      throw new Error('Implementation not initialized');
    }

    try {
      // Main implementation logic
      const result = await this.performTask();
      return {
        success: true,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Execution failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async performTask() {
    // TODO: Implement specific task logic
    return 'Task completed successfully';
  }
}

module.exports = Implementation;`,
            description: 'Generic implementation template for the requested task'
          }
        ],
        summary: 'Created basic implementation structure for the requested functionality'
      };
    }
  }

  async writeCodeToFiles(files) {
    const filePaths = [];
    const baseDir = process.cwd();

    for (const file of files) {
      try {
        const fullPath = path.join(baseDir, 'generated', file.path);
        const dir = path.dirname(fullPath);

        // Create directory if it doesn't exist
        await fs.mkdir(dir, { recursive: true });

        // Write file content
        await fs.writeFile(fullPath, file.content, 'utf8');
        filePaths.push(fullPath);

        console.log(`✅ Created file: ${file.path}`);
      } catch (error) {
        console.error(`❌ Failed to create file ${file.path}:`, error);
      }
    }

    return filePaths;
  }

  async createPullRequest(task, codeResult, filePaths) {
    if (!this.octokit) {
      throw new Error('GitHub integration not configured');
    }

    try {
      const owner = process.env.GITHUB_OWNER;
      const repo = process.env.GITHUB_REPO;
      const branchName = `feat/hackmate-${task.id}`;

      // Get the default branch
      const { data: repoData } = await this.octokit.rest.repos.get({
        owner,
        repo,
      });
      const defaultBranch = repoData.default_branch;

      // Get the latest commit SHA from default branch
      const { data: refData } = await this.octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`,
      });
      const latestCommitSha = refData.object.sha;

      // Create new branch
      await this.octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: latestCommitSha,
      });

      // Create blobs and tree for the new files
      const tree = [];
      for (const file of codeResult.files) {
        const { data: blob } = await this.octokit.rest.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64',
        });

        tree.push({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        });
      }

      // Create tree
      const { data: treeData } = await this.octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: latestCommitSha,
        tree,
      });

      // Create commit
      const { data: commitData } = await this.octokit.rest.git.createCommit({
        owner,
        repo,
        message: `feat: ${task.title}\n\n${task.description}`,
        tree: treeData.sha,
        parents: [latestCommitSha],
      });

      // Update branch reference
      await this.octokit.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${branchName}`,
        sha: commitData.sha,
      });

      // Create pull request
      const { data: prData } = await this.octokit.rest.pulls.create({
        owner,
        repo,
        title: `🤖 ${task.title}`,
        head: branchName,
        base: defaultBranch,
        body: `## AI Hack Mate Generated Code

**Task:** ${task.title}
**Description:** ${task.description}

### Summary
${codeResult.summary}

### Files Created
${codeResult.files.map(f => `- \`${f.path}\`: ${f.description}`).join('\n')}

---
*This PR was automatically generated by AI Hack Mate 🤖*`,
      });

      return prData.html_url;
    } catch (error) {
      console.error('Error creating pull request:', error);
      throw error;
    }
  }

  getStatus() {
    return this.status;
  }
}

module.exports = { CoderAgent };
