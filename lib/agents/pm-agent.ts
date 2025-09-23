import { Task } from './planner-agent';

export interface PMUpdate {
  message: string;
  channel: 'slack' | 'console' | 'webhook';
  status: 'sent' | 'failed' | 'pending';
  timestamp: string;
}

export interface PMConfig {
  slackToken?: string;
  channelId?: string;
}

// Format task message
const formatTaskMessage = (task: Task, updateType: string): string => {
  const emoji = {
    created: '🆕',
    started: '🚀',
    completed: '✅',
    failed: '❌'
  }[updateType] || '📝';

  return `${emoji} Task ${updateType.toUpperCase()}: ${task.title}\n` +
         `Agent: ${task.agent}\n` +
         `Status: ${task.status}\n` +
         `Description: ${task.description}`;
};

// Create Slack blocks
const createSlackBlocks = (task: Task, updateType: string) => {
  const emoji = {
    created: '🆕',
    started: '🚀',
    completed: '✅',
    failed: '❌'
  }[updateType] || '📝';

  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} Task ${updateType.charAt(0).toUpperCase() + updateType.slice(1)}`
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Title:*\n${task.title}`
        },
        {
          type: 'mrkdwn',
          text: `*Agent:*\n${task.agent}`
        },
        {
          type: 'mrkdwn',
          text: `*Status:*\n${task.status}`
        },
        {
          type: 'mrkdwn',
          text: `*Updated:*\n${new Date(task.updatedAt).toLocaleString()}`
        }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Description:*\n${task.description}`
      }
    }
  ];
};

// Generate project summary
const generateProjectSummary = (tasks: Task[]) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const failed = tasks.filter(t => t.status === 'failed').length;
  const queued = tasks.filter(t => t.status === 'queued').length;

  const text = `📊 Project Status Summary\n\n` +
               `Total Tasks: ${total}\n` +
               `✅ Completed: ${completed}\n` +
               `⚡ In Progress: ${inProgress}\n` +
               `❌ Failed: ${failed}\n` +
               `📋 Queued: ${queued}\n\n` +
               `Progress: ${total > 0 ? Math.round((completed / total) * 100) : 0}%`;

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📊 Project Status Summary'
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Total Tasks:* ${total}`
        },
        {
          type: 'mrkdwn',
          text: `*Progress:* ${total > 0 ? Math.round((completed / total) * 100) : 0}%`
        }
      ]
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `✅ *Completed:* ${completed}`
        },
        {
          type: 'mrkdwn',
          text: `⚡ *In Progress:* ${inProgress}`
        },
        {
          type: 'mrkdwn',
          text: `❌ *Failed:* ${failed}`
        },
        {
          type: 'mrkdwn',
          text: `📋 *Queued:* ${queued}`
        }
      ]
    }
  ];

  return { text, blocks };
};

// Send task update
export const sendTaskUpdate = async (
  task: Task, 
  updateType: 'created' | 'started' | 'completed' | 'failed',
  config?: PMConfig
): Promise<PMUpdate[]> => {
  const updates: PMUpdate[] = [];
  const message = formatTaskMessage(task, updateType);

  // Send to Slack if configured
  if (config?.slackToken && config?.channelId) {
    try {
      // Dynamic import to avoid dependency issues
      const { WebClient } = await import('@slack/web-api');
      const slack = new WebClient(config.slackToken);

      await slack.chat.postMessage({
        channel: config.channelId,
        text: message,
        blocks: createSlackBlocks(task, updateType)
      });

      updates.push({
        message,
        channel: 'slack',
        status: 'sent',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to send Slack message:', (error as Error).message);
      updates.push({
        message,
        channel: 'slack',
        status: 'failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Always log to console
  console.log(`📣 PM Update: ${message}`);
  updates.push({
    message,
    channel: 'console',
    status: 'sent',
    timestamp: new Date().toISOString()
  });

  return updates;
};

// Send project summary
export const sendProjectSummary = async (tasks: Task[], config?: PMConfig): Promise<PMUpdate[]> => {
  const summary = generateProjectSummary(tasks);
  const updates: PMUpdate[] = [];

  // Send to Slack if configured
  if (config?.slackToken && config?.channelId) {
    try {
      // Dynamic import to avoid dependency issues
      const { WebClient } = await import('@slack/web-api');
      const slack = new WebClient(config.slackToken);

      await slack.chat.postMessage({
        channel: config.channelId,
        text: summary.text,
        blocks: summary.blocks
      });

      updates.push({
        message: summary.text,
        channel: 'slack',
        status: 'sent',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to send Slack summary:', (error as Error).message);
      updates.push({
        message: summary.text,
        channel: 'slack',
        status: 'failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Log to console
  console.log(`📊 Project Summary:\n${summary.text}`);
  updates.push({
    message: summary.text,
    channel: 'console',
    status: 'sent',
    timestamp: new Date().toISOString()
  });

  return updates;
};

// Get PM status
export const getPMStatus = (config?: PMConfig) => {
  const slackToken = config?.slackToken || process.env.SLACK_BOT_TOKEN;
  const channelId = config?.channelId || process.env.SLACK_CHANNEL_ID;

  return {
    name: 'PM Agent',
    status: 'ready',
    capabilities: ['slack_notifications', 'progress_tracking', 'reporting'],
    slackEnabled: !!slackToken,
    channelConfigured: !!channelId
  };
};
