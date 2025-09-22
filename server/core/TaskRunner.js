const { v4: uuidv4 } = require('uuid');
const { PlannerAgent } = require('../agents/PlannerAgent');
const { CoderAgent } = require('../agents/CoderAgent');
const { DebuggerAgent } = require('../agents/DebuggerAgent');
const { PMAgent } = require('../agents/PMAgent');
const { MemoryManager } = require('./MemoryManager');

class TaskRunner {
  constructor() {
    this.tasks = new Map();
    this.agents = {};
    this.memoryManager = new MemoryManager();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize memory manager
      await this.memoryManager.initialize();

      // Initialize agents
      this.agents = {
        planner: new PlannerAgent(this.memoryManager),
        coder: new CoderAgent(this.memoryManager),
        debugger: new DebuggerAgent(this.memoryManager),
        pm: new PMAgent(this.memoryManager)
      };

      // Initialize all agents
      await Promise.all(
        Object.values(this.agents).map(agent => agent.initialize())
      );

      this.isInitialized = true;
      console.log('✅ TaskRunner initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize TaskRunner:', error);
      throw error;
    }
  }

  async createTaskFromProblem(problemStatement) {
    if (!this.isInitialized) {
      throw new Error('TaskRunner not initialized');
    }

    const taskId = uuidv4();
    
    // Create initial planning task
    const planningTask = {
      id: taskId,
      title: 'Planning: ' + problemStatement.substring(0, 50) + '...',
      description: problemStatement,
      status: 'queued',
      agent: 'planner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: ['Task created from problem statement'],
      metadata: {
        originalProblem: problemStatement,
        subtasks: []
      }
    };

    this.tasks.set(taskId, planningTask);

    // Start planning process
    this.executeTask(taskId);

    return taskId;
  }

  async executeTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    try {
      // Update task status
      task.status = 'in_progress';
      task.updatedAt = new Date().toISOString();
      task.logs.push(`Started execution with ${task.agent} agent`);

      // Get the appropriate agent
      const agent = this.agents[task.agent];
      if (!agent) {
        throw new Error(`Agent ${task.agent} not found`);
      }

      // Execute task with agent
      const result = await agent.execute(task);

      // Handle result based on agent type
      if (task.agent === 'planner' && result.subtasks) {
        // Create subtasks from planner result
        await this.createSubtasks(taskId, result.subtasks);
        
        // Mark planning task as done
        task.status = 'done';
        task.logs.push(`Planning completed. Created ${result.subtasks.length} subtasks`);
        task.metadata.subtasks = result.subtasks.map(st => st.id);
      } else {
        // Update task with result
        task.status = result.success ? 'done' : 'failed';
        task.logs.push(...result.logs);
        
        if (result.metadata) {
          task.metadata = { ...task.metadata, ...result.metadata };
        }
      }

      task.updatedAt = new Date().toISOString();

      // Notify PM agent about task completion
      if (this.agents.pm) {
        await this.agents.pm.notifyTaskUpdate(task);
      }

    } catch (error) {
      console.error(`Error executing task ${taskId}:`, error);
      
      task.status = 'failed';
      task.logs.push(`Execution failed: ${error.message}`);
      task.updatedAt = new Date().toISOString();
    }
  }

  async createSubtasks(parentTaskId, subtaskDefinitions) {
    const subtasks = [];

    for (const subtaskDef of subtaskDefinitions) {
      const subtaskId = uuidv4();
      const subtask = {
        id: subtaskId,
        title: subtaskDef.title,
        description: subtaskDef.description,
        status: 'queued',
        agent: subtaskDef.agent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        logs: [`Created as subtask of ${parentTaskId}`],
        metadata: {
          parentTaskId,
          priority: subtaskDef.priority || 'medium',
          ...subtaskDef.metadata
        }
      };

      this.tasks.set(subtaskId, subtask);
      subtasks.push(subtask);

      // Start executing subtask
      setTimeout(() => this.executeTask(subtaskId), 1000);
    }

    return subtasks;
  }

  async retryTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = 'queued';
    task.logs.push('Task retry requested');
    task.updatedAt = new Date().toISOString();

    // Re-execute task
    await this.executeTask(taskId);
  }

  getAllTasks() {
    return Array.from(this.tasks.values()).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  getAgentStatus() {
    const status = {};
    for (const [name, agent] of Object.entries(this.agents)) {
      status[name] = agent.getStatus();
    }
    return status;
  }

  async searchMemory(query, limit = 10) {
    return await this.memoryManager.search(query, limit);
  }
}

module.exports = { TaskRunner };
