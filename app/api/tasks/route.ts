import { NextRequest, NextResponse } from 'next/server';
import { TaskRunner } from '@/lib/core/task-runner';

// Global task runner instance
let taskRunner: TaskRunner | null = null;

async function getTaskRunner(): Promise<TaskRunner> {
  if (!taskRunner) {
    taskRunner = new TaskRunner({
      enableAI: !!process.env.GEMINI_API_KEY,
      enableGitHub: !!process.env.GITHUB_TOKEN,
      enableSlack: !!process.env.SLACK_WEBHOOK_URL,
      enableMemory: !!process.env.CHROMA_URL
    });
    await taskRunner.initialize();
  }
  return taskRunner;
}

export async function GET() {
  try {
    const runner = await getTaskRunner();
    const tasks = await runner.getAllTasks();
    
    return NextResponse.json({ 
      success: true,
      tasks,
      count: tasks.length 
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { problem } = body;

    if (!problem || typeof problem !== 'string') {
      return NextResponse.json(
        { error: 'Problem statement is required' },
        { status: 400 }
      );
    }

    const runner = await getTaskRunner();
    const taskId = await runner.createTaskFromProblem(problem.trim());

    return NextResponse.json({
      success: true,
      taskId,
      message: 'Task creation initiated'
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
