import { Task } from '../agents/planner-agent';

export interface WorkflowStep {
  id: string;
  name: string;
  agent: string;
  condition?: string; // JavaScript expression
  inputs?: Record<string, any>;
  outputs?: string[];
  timeout?: number; // in minutes
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
  triggers?: {
    schedule?: string; // cron expression
    webhook?: boolean;
    fileChange?: string; // file pattern
  };
}

export interface WorkflowExecution {
  id: string;
  templateId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  currentStep: number;
  startTime: Date;
  endTime?: Date;
  context: Record<string, any>;
  tasks: Task[];
}

// Built-in workflow templates
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'full-feature-development',
    name: 'Full Feature Development',
    description: 'Complete feature development from planning to deployment',
    category: 'development',
    steps: [
      {
        id: 'plan',
        name: 'Plan Feature',
        agent: 'planner',
        outputs: ['requirements', 'tasks']
      },
      {
        id: 'code',
        name: 'Generate Code',
        agent: 'coder',
        condition: 'context.requirements && context.tasks',
        inputs: { requirements: '${context.requirements}' },
        outputs: ['code', 'files']
      },
      {
        id: 'test',
        name: 'Test & Debug',
        agent: 'debugger',
        condition: 'context.code',
        inputs: { code: '${context.code}' },
        outputs: ['testResults', 'fixes']
      },
      {
        id: 'notify',
        name: 'Notify Team',
        agent: 'pm',
        condition: 'context.testResults.status === "passed"',
        inputs: { summary: '${context}' }
      }
    ]
  },
  {
    id: 'bug-fix-workflow',
    name: 'Bug Fix Workflow',
    description: 'Systematic bug identification and fixing',
    category: 'maintenance',
    steps: [
      {
        id: 'analyze',
        name: 'Analyze Bug Report',
        agent: 'planner',
        outputs: ['analysis', 'reproduction_steps']
      },
      {
        id: 'debug',
        name: 'Debug Issue',
        agent: 'debugger',
        condition: 'context.analysis',
        inputs: { issue: '${context.analysis}' },
        outputs: ['root_cause', 'fix_strategy']
      },
      {
        id: 'implement_fix',
        name: 'Implement Fix',
        agent: 'coder',
        condition: 'context.fix_strategy',
        inputs: { strategy: '${context.fix_strategy}' },
        outputs: ['fix_code', 'tests']
      },
      {
        id: 'verify',
        name: 'Verify Fix',
        agent: 'debugger',
        condition: 'context.fix_code',
        inputs: { code: '${context.fix_code}', tests: '${context.tests}' },
        outputs: ['verification_results']
      },
      {
        id: 'deploy',
        name: 'Deploy & Notify',
        agent: 'pm',
        condition: 'context.verification_results.success === true',
        inputs: { fix_summary: '${context}' }
      }
    ]
  },
  {
    id: 'code-review-workflow',
    name: 'Code Review Workflow',
    description: 'Automated code review and improvement suggestions',
    category: 'quality',
    steps: [
      {
        id: 'analyze_code',
        name: 'Analyze Code Quality',
        agent: 'debugger',
        outputs: ['quality_metrics', 'issues']
      },
      {
        id: 'suggest_improvements',
        name: 'Suggest Improvements',
        agent: 'coder',
        condition: 'context.issues && context.issues.length > 0',
        inputs: { issues: '${context.issues}' },
        outputs: ['improvements', 'refactored_code']
      },
      {
        id: 'generate_report',
        name: 'Generate Review Report',
        agent: 'pm',
        inputs: { 
          metrics: '${context.quality_metrics}',
          improvements: '${context.improvements}'
        }
      }
    ]
  },
  {
    id: 'ci-cd-integration',
    name: 'CI/CD Integration',
    description: 'Continuous integration and deployment workflow',
    category: 'devops',
    triggers: {
      webhook: true,
      fileChange: '**/*.{js,ts,jsx,tsx}'
    },
    steps: [
      {
        id: 'validate',
        name: 'Validate Changes',
        agent: 'debugger',
        outputs: ['validation_results']
      },
      {
        id: 'build',
        name: 'Build Application',
        agent: 'coder',
        condition: 'context.validation_results.valid === true',
        outputs: ['build_artifacts']
      },
      {
        id: 'deploy',
        name: 'Deploy to Staging',
        agent: 'pm',
        condition: 'context.build_artifacts',
        inputs: { artifacts: '${context.build_artifacts}' },
        outputs: ['deployment_url']
      },
      {
        id: 'notify_deployment',
        name: 'Notify Team',
        agent: 'pm',
        condition: 'context.deployment_url',
        inputs: { url: '${context.deployment_url}' }
      }
    ]
  }
];

// In-memory workflow executions storage
let workflowExecutions: WorkflowExecution[] = [];

export function createWorkflowExecution(templateId: string, initialContext: Record<string, any> = {}): WorkflowExecution {
  const template = WORKFLOW_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    throw new Error(`Workflow template not found: ${templateId}`);
  }

  const execution: WorkflowExecution = {
    id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    templateId,
    status: 'pending',
    currentStep: 0,
    startTime: new Date(),
    context: { ...initialContext },
    tasks: []
  };

  workflowExecutions.push(execution);
  return execution;
}

export function executeWorkflowStep(executionId: string, stepResult?: any): WorkflowExecution {
  const execution = workflowExecutions.find(e => e.id === executionId);
  if (!execution) {
    throw new Error(`Workflow execution not found: ${executionId}`);
  }

  const template = WORKFLOW_TEMPLATES.find(t => t.id === execution.templateId);
  if (!template) {
    throw new Error(`Workflow template not found: ${execution.templateId}`);
  }

  // Update context with step result
  if (stepResult) {
    execution.context = { ...execution.context, ...stepResult };
  }

  // Check if current step is completed
  const currentStep = template.steps[execution.currentStep];
  if (currentStep && stepResult) {
    // Store outputs in context
    if (currentStep.outputs) {
      currentStep.outputs.forEach(output => {
        if (stepResult[output]) {
          execution.context[output] = stepResult[output];
        }
      });
    }

    // Move to next step
    execution.currentStep++;
  }

  // Check if workflow is complete
  if (execution.currentStep >= template.steps.length) {
    execution.status = 'completed';
    execution.endTime = new Date();
    return execution;
  }

  // Get next step
  const nextStep = template.steps[execution.currentStep];
  
  // Check step condition
  if (nextStep.condition && !evaluateCondition(nextStep.condition, execution.context)) {
    // Skip this step
    execution.currentStep++;
    return executeWorkflowStep(executionId); // Recursively check next step
  }

  execution.status = 'running';
  return execution;
}

export function pauseWorkflow(executionId: string): WorkflowExecution {
  const execution = workflowExecutions.find(e => e.id === executionId);
  if (!execution) {
    throw new Error(`Workflow execution not found: ${executionId}`);
  }

  execution.status = 'paused';
  return execution;
}

export function resumeWorkflow(executionId: string): WorkflowExecution {
  const execution = workflowExecutions.find(e => e.id === executionId);
  if (!execution) {
    throw new Error(`Workflow execution not found: ${executionId}`);
  }

  if (execution.status === 'paused') {
    execution.status = 'running';
  }
  return execution;
}

export function cancelWorkflow(executionId: string): WorkflowExecution {
  const execution = workflowExecutions.find(e => e.id === executionId);
  if (!execution) {
    throw new Error(`Workflow execution not found: ${executionId}`);
  }

  execution.status = 'failed';
  execution.endTime = new Date();
  return execution;
}

export function getWorkflowExecution(executionId: string): WorkflowExecution | undefined {
  return workflowExecutions.find(e => e.id === executionId);
}

export function getAllWorkflowExecutions(): WorkflowExecution[] {
  return [...workflowExecutions];
}

export function getWorkflowTemplates(): WorkflowTemplate[] {
  return [...WORKFLOW_TEMPLATES];
}

export function createCustomWorkflow(template: Omit<WorkflowTemplate, 'id'>): WorkflowTemplate {
  const newTemplate: WorkflowTemplate = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...template
  };

  WORKFLOW_TEMPLATES.push(newTemplate);
  return newTemplate;
}

function evaluateCondition(condition: string, context: Record<string, any>): boolean {
  try {
    // Simple condition evaluation - in production, use a proper expression evaluator
    const func = new Function('context', `return ${condition}`);
    return func(context);
  } catch (error) {
    console.warn('Condition evaluation failed:', condition, error);
    return false;
  }
}

export function interpolateString(template: string, context: Record<string, any>): string {
  return template.replace(/\$\{([^}]+)\}/g, (match, path) => {
    const keys = path.split('.');
    let value = context;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return match; // Return original if path not found
      }
    }
    
    return String(value);
  });
}

export function getWorkflowMetrics(): {
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  popularTemplates: Array<{ templateId: string; count: number }>;
} {
  const completed = workflowExecutions.filter(e => e.status === 'completed');
  const failed = workflowExecutions.filter(e => e.status === 'failed');
  
  const averageExecutionTime = completed.length > 0
    ? completed.reduce((sum, e) => {
        const duration = e.endTime ? e.endTime.getTime() - e.startTime.getTime() : 0;
        return sum + duration;
      }, 0) / completed.length / (1000 * 60) // Convert to minutes
    : 0;

  const templateCounts: Record<string, number> = {};
  workflowExecutions.forEach(e => {
    templateCounts[e.templateId] = (templateCounts[e.templateId] || 0) + 1;
  });

  const popularTemplates = Object.entries(templateCounts)
    .map(([templateId, count]) => ({ templateId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalExecutions: workflowExecutions.length,
    completedExecutions: completed.length,
    failedExecutions: failed.length,
    averageExecutionTime,
    popularTemplates
  };
}
