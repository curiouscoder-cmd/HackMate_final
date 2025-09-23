import { Task } from '../agents/planner-agent';

export interface TaskAnalytics {
  overview: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    inProgressTasks: number;
    successRate: number;
    avgCompletionTime: number;
  };
  performance: {
    agentPerformance: Record<string, {
      tasksCompleted: number;
      successRate: number;
      avgTime: number;
      totalCost: number;
    }>;
    taskTypeDistribution: Record<string, number>;
    hourlyProductivity: Record<string, number>;
    dailyTrends: Array<{
      date: string;
      completed: number;
      failed: number;
      avgTime: number;
    }>;
  };
  costs: {
    totalCost: number;
    costByModel: Record<string, number>;
    costByAgent: Record<string, number>;
    costTrends: Array<{
      date: string;
      cost: number;
      tokens: number;
    }>;
  };
  productivity: {
    tasksPerHour: number;
    peakHours: string[];
    bottlenecks: Array<{
      agent: string;
      issue: string;
      impact: number;
    }>;
    recommendations: string[];
  };
}

export interface UsageMetrics {
  taskId: string;
  agent: string;
  model?: string;
  tokensUsed?: { input: number; output: number };
  cost?: number;
  startTime: Date;
  endTime?: Date;
  status: 'completed' | 'failed' | 'in_progress';
}

// In-memory metrics storage (in production, use a database)
let metricsStore: UsageMetrics[] = [];

export function recordTaskStart(taskId: string, agent: string, model?: string): void {
  metricsStore.push({
    taskId,
    agent,
    model,
    startTime: new Date(),
    status: 'in_progress'
  });
}

export function recordTaskCompletion(
  taskId: string, 
  status: 'completed' | 'failed',
  tokensUsed?: { input: number; output: number },
  cost?: number
): void {
  const metric = metricsStore.find(m => m.taskId === taskId);
  if (metric) {
    metric.endTime = new Date();
    metric.status = status;
    metric.tokensUsed = tokensUsed;
    metric.cost = cost;
  }
}

export function generateAnalytics(tasks: Task[]): TaskAnalytics {
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentTasks = tasks.filter(task => new Date(task.createdAt) >= last7Days);

  return {
    overview: calculateOverview(tasks),
    performance: calculatePerformance(tasks),
    costs: calculateCosts(),
    productivity: calculateProductivity(recentTasks)
  };
}

function calculateOverview(tasks: Task[]) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const failedTasks = tasks.filter(t => t.status === 'failed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculate average completion time
  const completedWithMetrics = tasks.filter(t => t.status === 'done');
  const avgCompletionTime = completedWithMetrics.length > 0 
    ? completedWithMetrics.reduce((sum, task) => {
        const start = new Date(task.createdAt).getTime();
        const end = new Date(task.updatedAt).getTime();
        return sum + (end - start);
      }, 0) / completedWithMetrics.length / (1000 * 60) // Convert to minutes
    : 0;

  return {
    totalTasks,
    completedTasks,
    failedTasks,
    inProgressTasks,
    successRate,
    avgCompletionTime
  };
}

function calculatePerformance(tasks: Task[]) {
  const agentPerformance: Record<string, any> = {};
  const taskTypeDistribution: Record<string, number> = {};
  const hourlyProductivity: Record<string, number> = {};

  // Agent performance
  ['planner', 'coder', 'debugger', 'pm'].forEach(agent => {
    const agentTasks = tasks.filter(t => t.agent === agent);
    const completed = agentTasks.filter(t => t.status === 'done').length;
    const successRate = agentTasks.length > 0 ? (completed / agentTasks.length) * 100 : 0;
    
    const avgTime = completed > 0 
      ? agentTasks.filter(t => t.status === 'done').reduce((sum, task) => {
          const start = new Date(task.createdAt).getTime();
          const end = new Date(task.updatedAt).getTime();
          return sum + (end - start);
        }, 0) / completed / (1000 * 60)
      : 0;

    const totalCost = metricsStore
      .filter(m => m.agent === agent && m.cost)
      .reduce((sum, m) => sum + (m.cost || 0), 0);

    agentPerformance[agent] = {
      tasksCompleted: completed,
      successRate,
      avgTime,
      totalCost
    };
  });

  // Task type distribution
  tasks.forEach(task => {
    const type = task.metadata?.type || 'general';
    taskTypeDistribution[type] = (taskTypeDistribution[type] || 0) + 1;
  });

  // Hourly productivity
  tasks.forEach(task => {
    const hour = new Date(task.createdAt).getHours();
    const hourKey = `${hour}:00`;
    hourlyProductivity[hourKey] = (hourlyProductivity[hourKey] || 0) + 1;
  });

  // Daily trends (last 7 days)
  const dailyTrends = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayTasks = tasks.filter(t => 
      t.createdAt.startsWith(dateStr)
    );
    
    const completed = dayTasks.filter(t => t.status === 'done').length;
    const failed = dayTasks.filter(t => t.status === 'failed').length;
    const avgTime = completed > 0 
      ? dayTasks.filter(t => t.status === 'done').reduce((sum, task) => {
          const start = new Date(task.createdAt).getTime();
          const end = new Date(task.updatedAt).getTime();
          return sum + (end - start);
        }, 0) / completed / (1000 * 60)
      : 0;

    dailyTrends.push({
      date: dateStr,
      completed,
      failed,
      avgTime
    });
  }

  return {
    agentPerformance,
    taskTypeDistribution,
    hourlyProductivity,
    dailyTrends
  };
}

function calculateCosts() {
  const totalCost = metricsStore.reduce((sum, m) => sum + (m.cost || 0), 0);
  
  const costByModel: Record<string, number> = {};
  const costByAgent: Record<string, number> = {};
  
  metricsStore.forEach(metric => {
    if (metric.cost) {
      if (metric.model) {
        costByModel[metric.model] = (costByModel[metric.model] || 0) + metric.cost;
      }
      costByAgent[metric.agent] = (costByAgent[metric.agent] || 0) + metric.cost;
    }
  });

  // Cost trends (last 7 days)
  const costTrends = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayMetrics = metricsStore.filter(m => 
      m.startTime.toISOString().startsWith(dateStr)
    );
    
    const cost = dayMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);
    const tokens = dayMetrics.reduce((sum, m) => 
      sum + ((m.tokensUsed?.input || 0) + (m.tokensUsed?.output || 0)), 0
    );

    costTrends.push({
      date: dateStr,
      cost,
      tokens
    });
  }

  return {
    totalCost,
    costByModel,
    costByAgent,
    costTrends
  };
}

function calculateProductivity(recentTasks: Task[]) {
  const tasksPerHour = recentTasks.length / (7 * 24); // Tasks per hour over last 7 days
  
  // Find peak hours
  const hourlyCount: Record<number, number> = {};
  recentTasks.forEach(task => {
    const hour = new Date(task.createdAt).getHours();
    hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
  });
  
  const peakHours = Object.entries(hourlyCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => `${hour}:00`);

  // Identify bottlenecks
  const bottlenecks: Array<{
    agent: string;
    issue: string;
    impact: number;
  }> = [];
  
  const agentFailRates = ['planner', 'coder', 'debugger', 'pm'].map(agent => {
    const agentTasks = recentTasks.filter(t => t.agent === agent);
    const failRate = agentTasks.length > 0 
      ? (agentTasks.filter(t => t.status === 'failed').length / agentTasks.length) * 100
      : 0;
    
    return { agent, failRate };
  });

  agentFailRates.forEach(({ agent, failRate }) => {
    if (failRate > 20) {
      bottlenecks.push({
        agent,
        issue: 'High failure rate',
        impact: failRate
      });
    }
  });

  // Generate recommendations
  const recommendations = [];
  if (bottlenecks.length > 0) {
    recommendations.push(`Address high failure rates in ${bottlenecks.map(b => b.agent).join(', ')}`);
  }
  if (tasksPerHour < 1) {
    recommendations.push('Consider optimizing task processing speed');
  }
  if (peakHours.length > 0) {
    recommendations.push(`Peak productivity hours: ${peakHours.join(', ')} - schedule important tasks during these times`);
  }

  return {
    tasksPerHour,
    peakHours,
    bottlenecks,
    recommendations
  };
}

export function exportMetrics(): UsageMetrics[] {
  return [...metricsStore];
}

export function importMetrics(metrics: UsageMetrics[]): void {
  metricsStore = [...metrics];
}

export function clearMetrics(): void {
  metricsStore = [];
}

export function getMetricsCount(): number {
  return metricsStore.length;
}
