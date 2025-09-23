import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    const runner = await getTaskRunner();
    const status = runner.getAgentStatus();

    return NextResponse.json({
      success: true,
      agents: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting agent status:', error);
    return NextResponse.json(
      { error: 'Failed to get agent status', message: (error as Error).message },
      { status: 500 }
    );
  }
}
