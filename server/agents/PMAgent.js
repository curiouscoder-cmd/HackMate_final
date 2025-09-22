const { WebClient } = require('@slack/web-api');

class PMAgent {
  constructor(memoryManager) {
    this.memoryManager = memoryManager;
    this.status = 'idle';
    this.slackClient = null;
    this.channelId = process.env.SLACK_CHANNEL_ID;
  }

  async initialize() {
    try {
      // Initialize Slack client if token is provided
      if (process.env.SLACK_BOT_TOKEN) {
        this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
        
        // Test the connection
        await this.slackClient.auth.test();
        console.log('✅ PM Agent initialized with Slack integration');
      } else {
        console.log('✅ PM Agent initialized (Slack integration disabled)');
      }
    } catch (error) {
      console.error('❌ Failed to initialize PM Agent:', error);
      // Don't throw error, just disable Slack functionality
      this.slackClient = null;
    }
  }

  async execute(task) {
    this.status = 'working';
    
    try {
      const logs = ['Starting PM task execution'];
      
      // Store task context
      await this.memoryManager.storeTaskContext(task.id, {
        task: task.title,
        description: task.description,
        agent: 'pm',
        startTime: Date.now()
      });

      // Send progress update
      const updateResult = await this.sendProgressUpdate(task);
      logs.push('Progress update sent');

      // Generate summary if requested
      let summary = null;
      if (task.description.includes('summary') || task.description.includes('report')) {
        summary = await this.generateSummary();
        logs.push('Summary generated');
      }

      this.status = 'idle';

      return {
        success: true,
        logs,
        metadata: {
          updateSent: updateResult.sent,
          summary,
          channel: this.channelId
        }
      };
    } catch (error) {
      this.status = 'idle';
      throw error;
    }
  }

  async notifyTaskUpdate(task) {
    try {
      const message = this.formatTaskUpdateMessage(task);
      
      if (this.slackClient && this.channelId) {
        await this.slackClient.chat.postMessage({
          channel: this.channelId,
          ...message
        });
        console.log(`📣 Sent Slack notification for task ${task.id}`);
      } else {
        console.log(`📣 Task update (Slack disabled): ${task.title} - ${task.status}`);
      }
    } catch (error) {
      console.error('Error sending task notification:', error);
    }
  }

  async sendProgressUpdate(task) {
    try {
      const message = this.formatProgressMessage(task);
      
      if (this.slackClient && this.channelId) {
        const result = await this.slackClient.chat.postMessage({
          channel: this.channelId,
          ...message
        });
        
        return { sent: true, messageId: result.ts };
      } else {
        console.log(`📣 Progress update (Slack disabled): ${message.text}`);
        return { sent: false, reason: 'Slack not configured' };
      }
    } catch (error) {
      console.error('Error sending progress update:', error);
      return { sent: false, error: error.message };
    }
  }

  async generateSummary() {
    try {
      // Get recent task data from memory
      const recentTasks = await this.memoryManager.search('task_context', 10);
      
      const summary = {
        timestamp: new Date().toISOString(),
        totalTasks: recentTasks.length,
        completedTasks: recentTasks.filter(t => t.content.includes('completed')).length,
        activeAgents: ['planner', 'coder', 'debugger', 'pm'],
        recentActivity: recentTasks.slice(0, 5).map(t => ({
          task: t.metadata?.taskId || 'unknown',
          type: t.metadata?.type || 'unknown',
          timestamp: t.metadata?.timestamp || Date.now()
        }))
      };

      // Send summary to Slack if configured
      if (this.slackClient && this.channelId) {
        await this.sendSummaryToSlack(summary);
      }

      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      return null;
    }
  }

  formatTaskUpdateMessage(task) {
    const statusEmoji = {
      'queued': '📋',
      'in_progress': '⚡',
      'done': '✅',
      'failed': '❌'
    };

    const agentEmoji = {
      'planner': '🧠',
      'coder': '👨‍💻',
      'debugger': '🐞',
      'pm': '📣'
    };

    const color = {
      'queued': '#6B7280',
      'in_progress': '#3B82F6',
      'done': '#10B981',
      'failed': '#EF4444'
    }[task.status];

    let text = `${statusEmoji[task.status]} Task ${task.status.replace('_', ' ')}: *${task.title}*`;
    
    if (task.metadata?.prUrl) {
      text += `\n🔗 <${task.metadata.prUrl}|View Pull Request>`;
    }

    return {
      text,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${agentEmoji[task.agent]} *${task.agent.toUpperCase()} AGENT*\n${statusEmoji[task.status]} ${task.title}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Status:* ${task.status.replace('_', ' ')}\n*Description:* ${task.description}`
          }
        },
        ...(task.metadata?.prUrl ? [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🔗 <${task.metadata.prUrl}|View Pull Request>`
          }
        }] : []),
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Updated: ${new Date(task.updatedAt).toLocaleString()}`
            }
          ]
        }
      ],
      attachments: [
        {
          color,
          fields: [
            {
              title: 'Agent',
              value: task.agent,
              short: true
            },
            {
              title: 'Status',
              value: task.status.replace('_', ' '),
              short: true
            }
          ]
        }
      ]
    };
  }

  formatProgressMessage(task) {
    return {
      text: `🤖 AI Hack Mate Progress Update`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🤖 AI Hack Mate Progress Update'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Working on: *${task.title}*\n${task.description}`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Agent:* ${task.agent}`
            },
            {
              type: 'mrkdwn',
              text: `*Status:* ${task.status.replace('_', ' ')}`
            }
          ]
        }
      ]
    };
  }

  async sendSummaryToSlack(summary) {
    if (!this.slackClient || !this.channelId) return;

    try {
      await this.slackClient.chat.postMessage({
        channel: this.channelId,
        text: '📊 AI Hack Mate Daily Summary',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '📊 AI Hack Mate Daily Summary'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Total Tasks:* ${summary.totalTasks}`
              },
              {
                type: 'mrkdwn',
                text: `*Completed:* ${summary.completedTasks}`
              },
              {
                type: 'mrkdwn',
                text: `*Success Rate:* ${Math.round((summary.completedTasks / summary.totalTasks) * 100)}%`
              },
              {
                type: 'mrkdwn',
                text: `*Active Agents:* ${summary.activeAgents.length}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Recent Activity:*\n' + summary.recentActivity.map(activity => 
                `• Task ${activity.task} (${activity.type})`
              ).join('\n')
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Generated: ${new Date(summary.timestamp).toLocaleString()}`
              }
            ]
          }
        ]
      });
    } catch (error) {
      console.error('Error sending summary to Slack:', error);
    }
  }

  getStatus() {
    return this.status;
  }
}

module.exports = { PMAgent };
