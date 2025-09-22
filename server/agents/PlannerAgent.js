const { GoogleGenerativeAI } = require('@google/generative-ai');

class PlannerAgent {
  constructor(memoryManager) {
    this.memoryManager = memoryManager;
    this.status = 'idle';
    this.genAI = null;
    this.model = null;
  }

  async initialize() {
    try {
      if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️ GEMINI_API_KEY not set, Planner Agent will use mock responses');
        return;
      }

      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      console.log('✅ Planner Agent initialized with Gemini');
    } catch (error) {
      console.error('❌ Failed to initialize Planner Agent:', error);
      throw error;
    }
  }

  async execute(task) {
    this.status = 'working';
    
    try {
      const problemStatement = task.description;
      
      // Store task context in memory
      await this.memoryManager.storeTaskContext(task.id, {
        problem: problemStatement,
        agent: 'planner',
        startTime: Date.now()
      });

      // Generate plan using Gemini or mock
      const subtasks = await this.generatePlan(problemStatement);
      
      // Store planning decision
      await this.memoryManager.storePlanningDecision(
        task.id,
        `Generated ${subtasks.length} subtasks`,
        `Analyzed problem: "${problemStatement}" and broke it down into actionable tasks`
      );

      this.status = 'idle';
      
      return {
        success: true,
        subtasks,
        logs: [
          'Analyzed problem statement',
          `Generated ${subtasks.length} subtasks`,
          'Planning completed successfully'
        ]
      };
    } catch (error) {
      this.status = 'idle';
      throw error;
    }
  }

  async generatePlan(problemStatement) {
    if (!this.model) {
      // Mock response when Gemini is not available
      return this.generateMockPlan(problemStatement);
    }

    try {
      const prompt = `
You are an expert software development planner. Break down this problem into specific, actionable tasks.

Problem: ${problemStatement}

For each task, specify:
1. Title (concise, action-oriented)
2. Description (detailed requirements)
3. Agent (coder, debugger, or pm)
4. Priority (high, medium, low)

Return a JSON array of tasks. Example format:
[
  {
    "title": "Create API endpoint",
    "description": "Implement /health endpoint that returns server status",
    "agent": "coder",
    "priority": "high"
  }
]

Focus on:
- Breaking complex tasks into smaller, manageable pieces
- Assigning the right agent for each task type
- Logical order and dependencies
- Clear, specific requirements
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tasks = JSON.parse(jsonMatch[0]);
        return tasks.map(task => ({
          ...task,
          metadata: { generatedBy: 'gemini' }
        }));
      } else {
        throw new Error('Could not parse plan from Gemini response');
      }
    } catch (error) {
      console.error('Error generating plan with Gemini:', error);
      // Fallback to mock plan
      return this.generateMockPlan(problemStatement);
    }
  }

  generateMockPlan(problemStatement) {
    // Analyze problem statement and generate appropriate tasks
    const tasks = [];
    
    if (problemStatement.toLowerCase().includes('endpoint') || 
        problemStatement.toLowerCase().includes('api')) {
      tasks.push({
        title: 'Implement API Endpoint',
        description: `Create the requested endpoint based on: ${problemStatement}`,
        agent: 'coder',
        priority: 'high',
        metadata: { generatedBy: 'mock' }
      });
      
      tasks.push({
        title: 'Add Tests for Endpoint',
        description: 'Write unit tests to verify endpoint functionality',
        agent: 'coder',
        priority: 'medium',
        metadata: { generatedBy: 'mock' }
      });
    } else if (problemStatement.toLowerCase().includes('component') ||
               problemStatement.toLowerCase().includes('ui')) {
      tasks.push({
        title: 'Create UI Component',
        description: `Build the requested component: ${problemStatement}`,
        agent: 'coder',
        priority: 'high',
        metadata: { generatedBy: 'mock' }
      });
      
      tasks.push({
        title: 'Style Component',
        description: 'Add responsive styling and ensure good UX',
        agent: 'coder',
        priority: 'medium',
        metadata: { generatedBy: 'mock' }
      });
    } else {
      // Generic task breakdown
      tasks.push({
        title: 'Analyze Requirements',
        description: `Analyze and implement: ${problemStatement}`,
        agent: 'coder',
        priority: 'high',
        metadata: { generatedBy: 'mock' }
      });
      
      tasks.push({
        title: 'Test Implementation',
        description: 'Verify the implementation works correctly',
        agent: 'debugger',
        priority: 'medium',
        metadata: { generatedBy: 'mock' }
      });
    }

    // Always add a PM task for updates
    tasks.push({
      title: 'Send Progress Update',
      description: 'Notify team about task completion and results',
      agent: 'pm',
      priority: 'low',
      metadata: { generatedBy: 'mock' }
    });

    return tasks;
  }

  getStatus() {
    return this.status;
  }
}

module.exports = { PlannerAgent };
