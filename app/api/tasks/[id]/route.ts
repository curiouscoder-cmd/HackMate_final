import { NextRequest, NextResponse } from 'next/server';
import { TaskRunner } from '@/lib/core/task-runner';

// Global task runner instance
let taskRunner: TaskRunner | null = null;

async function getTaskRunner(): Promise<TaskRunner> {
  if (!taskRunner) {
    taskRunner = new TaskRunner({
      enableAI: !!process.env.GEMINI_API_KEY,
      enableGitHub: !!process.env.GITHUB_TOKEN,
      enableSlack: !!process.env.SLACK_BOT_TOKEN,
      enableMemory: !!process.env.CHROMA_URL
    });
    await taskRunner.initialize();
  }
  return taskRunner;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const runner = await getTaskRunner();
    const task = await runner.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      task 
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
