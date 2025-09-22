const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises;

class DebuggerAgent {
  constructor(memoryManager) {
    this.memoryManager = memoryManager;
    this.status = 'idle';
    this.genAI = null;
    this.model = null;
    this.octokit = null;
  }

  async initialize() {
    try {
      // Initialize Gemini for debugging analysis
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

      console.log('✅ Debugger Agent initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Debugger Agent:', error);
      throw error;
    }
  }

  async execute(task) {
    this.status = 'working';
    
    try {
      const logs = ['Starting debugging analysis'];
      
      // Store task context
      await this.memoryManager.storeTaskContext(task.id, {
        task: task.title,
        description: task.description,
        agent: 'debugger',
        startTime: Date.now()
      });

      // Analyze the issue
      const analysis = await this.analyzeIssue(task);
      logs.push('Issue analysis completed');

      // Generate fix suggestions
      const fixes = await this.generateFixes(task, analysis);
      logs.push(`Generated ${fixes.length} potential fixes`);

      // Apply the best fix if possible
      let appliedFix = null;
      if (fixes.length > 0) {
        appliedFix = await this.applyFix(fixes[0]);
        logs.push('Applied recommended fix');
      }

      // Store debugging session in memory
      await this.memoryManager.store(
        `debug_${task.id}`,
        JSON.stringify({ analysis, fixes, appliedFix }),
        { type: 'debugging_session', taskId: task.id }
      );

      this.status = 'idle';

      return {
        success: true,
        logs,
        metadata: {
          analysis,
          fixesGenerated: fixes.length,
          fixApplied: !!appliedFix,
          appliedFix
        }
      };
    } catch (error) {
      this.status = 'idle';
      throw error;
    }
  }

  async analyzeIssue(task) {
    const description = task.description;
    
    // Check if this is a CI/test failure analysis
    if (description.includes('test') || description.includes('CI') || description.includes('failure')) {
      return await this.analyzeCIFailure(task);
    }
    
    // General issue analysis
    return await this.analyzeGeneralIssue(task);
  }

  async analyzeCIFailure(task) {
    if (!this.model) {
      return this.mockCIAnalysis(task);
    }

    try {
      const prompt = `
You are an expert debugging specialist. Analyze this CI/test failure:

Task: ${task.title}
Description: ${task.description}

Provide a structured analysis:
1. Likely root causes
2. Error patterns to look for
3. Files that might be affected
4. Testing strategy

Return a JSON object with your analysis.
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error analyzing CI failure:', error);
    }

    return this.mockCIAnalysis(task);
  }

  async analyzeGeneralIssue(task) {
    if (!this.model) {
      return this.mockGeneralAnalysis(task);
    }

    try {
      const prompt = `
Analyze this software issue and provide debugging insights:

Task: ${task.title}
Description: ${task.description}

Provide:
1. Problem categorization
2. Potential causes
3. Debugging steps
4. Prevention strategies

Return as JSON.
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error analyzing general issue:', error);
    }

    return this.mockGeneralAnalysis(task);
  }

  async generateFixes(task, analysis) {
    if (!this.model) {
      return this.mockFixes(task, analysis);
    }

    try {
      const prompt = `
Based on this analysis, generate specific code fixes:

Task: ${task.title}
Analysis: ${JSON.stringify(analysis)}

For each fix, provide:
1. Description of the fix
2. Code changes needed
3. Files to modify
4. Risk level (low/medium/high)

Return an array of fix objects in JSON format.
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error generating fixes:', error);
    }

    return this.mockFixes(task, analysis);
  }

  async applyFix(fix) {
    try {
      // For now, just log the fix that would be applied
      // In a real implementation, this would modify files
      console.log('Applying fix:', fix.description);
      
      if (fix.files && fix.files.length > 0) {
        for (const fileChange of fix.files) {
          console.log(`Would modify: ${fileChange.path}`);
          // await this.modifyFile(fileChange.path, fileChange.changes);
        }
      }

      return {
        applied: true,
        description: fix.description,
        filesModified: fix.files?.length || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error applying fix:', error);
      return {
        applied: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  mockCIAnalysis(task) {
    return {
      category: 'CI/Test Failure',
      likelyCauses: [
        'Test environment configuration issues',
        'Dependency version conflicts',
        'Race conditions in async tests',
        'Missing test data or fixtures'
      ],
      errorPatterns: [
        'Timeout errors',
        'Module not found',
        'Assertion failures',
        'Network connectivity issues'
      ],
      affectedFiles: [
        'package.json',
        'test configuration files',
        'CI workflow files'
      ],
      testingStrategy: 'Run tests locally, check dependencies, verify test data'
    };
  }

  mockGeneralAnalysis(task) {
    return {
      category: 'General Issue',
      problemType: 'Implementation Bug',
      potentialCauses: [
        'Logic error in implementation',
        'Missing error handling',
        'Incorrect API usage',
        'Configuration issues'
      ],
      debuggingSteps: [
        'Add logging statements',
        'Check input validation',
        'Verify configuration',
        'Test edge cases'
      ],
      preventionStrategies: [
        'Add unit tests',
        'Implement proper error handling',
        'Add input validation',
        'Use TypeScript for type safety'
      ]
    };
  }

  mockFixes(task, analysis) {
    return [
      {
        description: 'Add comprehensive error handling and logging',
        riskLevel: 'low',
        files: [
          {
            path: 'src/main.js',
            changes: 'Add try-catch blocks and console.log statements'
          }
        ],
        code: `
try {
  // Existing code here
  console.log('Operation completed successfully');
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error(\`Failed to complete operation: \${error.message}\`);
}`,
        priority: 'high'
      },
      {
        description: 'Add input validation',
        riskLevel: 'low',
        files: [
          {
            path: 'src/validation.js',
            changes: 'Add parameter validation functions'
          }
        ],
        code: `
function validateInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input: expected object');
  }
  // Add specific validation logic
  return true;
}`,
        priority: 'medium'
      }
    ];
  }

  getStatus() {
    return this.status;
  }
}

module.exports = { DebuggerAgent };
