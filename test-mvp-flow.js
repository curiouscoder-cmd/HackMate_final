#!/usr/bin/env node

/**
 * HackMate MVP Test Script
 * Tests the complete autonomous flow: Problem → Plan → Code → PR → Slack
 */

import dotenv from 'dotenv';
import { TaskRunner } from './lib/core/task-runner.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testMVPFlow() {
  console.log('🚀 Testing HackMate MVP Flow...\n');

  // Check required environment variables
  const requiredEnvs = {
    'GEMINI_API_KEY': process.env.GEMINI_API_KEY,
    'GITHUB_TOKEN': process.env.GITHUB_TOKEN,
    'GITHUB_OWNER': process.env.GITHUB_OWNER,
    'GITHUB_REPO': process.env.GITHUB_REPO,
    'SLACK_WEBHOOK_URL': process.env.SLACK_WEBHOOK_URL
  };

  console.log('📋 Environment Check:');
  for (const [key, value] of Object.entries(requiredEnvs)) {
    const status = value ? '✅' : '❌';
    const display = value ? `${value.substring(0, 10)}...` : 'Not set';
    console.log(`  ${status} ${key}: ${display}`);
  }
  console.log();

  // Initialize TaskRunner
  const taskRunner = new TaskRunner({
    enableAI: !!process.env.GEMINI_API_KEY,
    enableGitHub: !!(process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO),
    enableSlack: !!process.env.SLACK_WEBHOOK_URL,
    enableMemory: true
  });

  try {
    // Initialize the system
    console.log('🔧 Initializing TaskRunner...');
    await taskRunner.initialize();
    console.log('✅ TaskRunner initialized\n');

    // Check agent status
    console.log('🤖 Agent Status:');
    const status = taskRunner.getAgentStatus();
    for (const [agent, info] of Object.entries(status)) {
      if (typeof info === 'object' && info.name) {
        const statusIcon = info.status === 'ready' ? '✅' : '❌';
        console.log(`  ${statusIcon} ${info.name}: ${info.status}`);
        
        // Show capabilities
        if (info.capabilities) {
          console.log(`     Capabilities: ${info.capabilities.join(', ')}`);
        }
        
        // Show integration status
        if (info.aiEnabled !== undefined) {
          console.log(`     AI: ${info.aiEnabled ? '✅' : '❌'}`);
        }
        if (info.githubEnabled !== undefined) {
          console.log(`     GitHub: ${info.githubEnabled ? '✅' : '❌'}`);
        }
        if (info.slackEnabled !== undefined) {
          console.log(`     Slack: ${info.slackEnabled ? '✅' : '❌'}`);
        }
      }
    }
    console.log();

    // Test the autonomous flow
    console.log('🎯 Starting Autonomous Flow Test...');
    const testProblem = "Add a /health endpoint to check server status";
    console.log(`Problem: "${testProblem}"\n`);

    // Create tasks from problem
    console.log('📝 Creating tasks from problem...');
    const taskId = await taskRunner.createTaskFromProblem(testProblem);
    console.log(`✅ Tasks created, starting with: ${taskId}\n`);

    // Monitor task execution
    console.log('⏳ Monitoring task execution...');
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    while (attempts < maxAttempts) {
      const tasks = await taskRunner.getAllTasks();
      const inProgress = tasks.filter(t => t.status === 'in_progress').length;
      const completed = tasks.filter(t => t.status === 'done').length;
      const failed = tasks.filter(t => t.status === 'failed').length;
      const queued = tasks.filter(t => t.status === 'queued').length;

      console.log(`  📊 Status: ${queued} queued, ${inProgress} in progress, ${completed} completed, ${failed} failed`);

      // Show recent logs
      const recentTask = tasks.find(t => t.status === 'in_progress' || (t.logs.length > 1 && t.updatedAt));
      if (recentTask && recentTask.logs.length > 0) {
        const lastLog = recentTask.logs[recentTask.logs.length - 1];
        console.log(`  📝 Latest: ${recentTask.title} - ${lastLog}`);
      }

      // Check if all tasks are done or failed
      if (inProgress === 0 && queued === 0) {
        console.log('\n🎉 All tasks completed!');
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    // Final status report
    console.log('\n📊 Final Results:');
    const finalTasks = await taskRunner.getAllTasks();
    
    for (const task of finalTasks) {
      const statusIcon = {
        'done': '✅',
        'failed': '❌',
        'in_progress': '⏳',
        'queued': '📋'
      }[task.status] || '❓';
      
      console.log(`  ${statusIcon} ${task.title} (${task.agent})`);
      
      // Show PR URL if available
      if (task.metadata?.result?.prUrl) {
        console.log(`     🔗 PR: ${task.metadata.result.prUrl}`);
      }
      
      // Show last log entry
      if (task.logs.length > 0) {
        console.log(`     📝 ${task.logs[task.logs.length - 1]}`);
      }
    }

    // Success metrics
    const completedTasks = finalTasks.filter(t => t.status === 'done').length;
    const totalTasks = finalTasks.length;
    const successRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : '0';
    
    console.log(`\n🎯 Success Rate: ${successRate}% (${completedTasks}/${totalTasks} tasks completed)`);

    // Check for PR creation
    const coderTasks = finalTasks.filter(t => t.agent === 'coder' && t.status === 'done');
    const prsCreated = coderTasks.filter(t => t.metadata?.result?.prUrl).length;
    
    if (prsCreated > 0) {
      console.log(`🚀 GitHub PRs Created: ${prsCreated}`);
      coderTasks.forEach(task => {
        if (task.metadata?.result?.prUrl) {
          console.log(`   - ${task.metadata.result.prUrl}`);
        }
      });
    }

    console.log('\n✅ MVP Flow Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup
    await taskRunner.shutdown();
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testMVPFlow().catch(console.error);
}

export { testMVPFlow };
