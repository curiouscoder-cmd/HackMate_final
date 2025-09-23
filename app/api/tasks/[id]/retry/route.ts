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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const runner = await getTaskRunner();
    await runner.retryTask(params.id);

    return NextResponse.json({
      success: true,
      message: 'Task retry initiated'
    });
  } catch (error) {
    console.error('Error retrying task:', error);
    return NextResponse.json(
      { error: 'Failed to retry task', message: error.message },
      { status: 500 }
    );
  }
}
