export interface SlackMessage {
  text: string;
  username?: string;
  icon_emoji?: string;
  channel?: string;
  attachments?: SlackAttachment[];
}

export interface SlackAttachment {
  color?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: SlackField[];
}

export interface SlackField {
  title: string;
  value: string;
  short?: boolean;
}

export interface SlackConfig {
  webhookUrl?: string;
}

// Send message to Slack
export const sendSlackMessage = async (message: SlackMessage, config?: SlackConfig): Promise<boolean> => {
  try {
    const webhookUrl = config?.webhookUrl || process.env.SLACK_WEBHOOK_URL;
    
    console.log('🔍 Slack Debug:', {
      configUrl: config?.webhookUrl ? 'provided' : 'not provided',
      envUrl: process.env.SLACK_WEBHOOK_URL ? 'set' : 'not set',
      finalUrl: webhookUrl ? 'resolved' : 'missing'
    });
    
    if (!webhookUrl) {
      console.warn('❌ Slack webhook URL not configured');
      return false;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'HackMate Bot',
        icon_emoji: ':robot_face:',
        ...message
      })
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Failed to send Slack message:', (error as Error).message);
    return false;
  }
};

// Send task status update
export const sendTaskUpdate = async (
  taskTitle: string, 
  status: 'started' | 'completed' | 'failed', 
  details?: string,
  prUrl?: string,
  config?: SlackConfig
): Promise<boolean> => {
  const statusEmojis = {
    started: ':hourglass_flowing_sand:',
    completed: ':white_check_mark:',
    failed: ':x:'
  };

  const statusColors = {
    started: '#36a64f',
    completed: '#36a64f', 
    failed: '#ff0000'
  };

  const message: SlackMessage = {
    text: `${statusEmojis[status]} Task ${status}: *${taskTitle}*`,
    attachments: [
      {
        color: statusColors[status],
        fields: [
          ...(details ? [{ title: 'Details', value: details, short: false }] : []),
          ...(prUrl ? [{ title: 'Pull Request', value: `<${prUrl}|View PR>`, short: true }] : [])
        ]
      }
    ]
  };

  return await sendSlackMessage(message, config);
};

// Send planning complete notification
export const sendPlanningComplete = async (
  problem: string,
  taskCount: number,
  config?: SlackConfig
): Promise<boolean> => {
  const message: SlackMessage = {
    text: `:brain: Planning Complete!`,
    attachments: [
      {
        color: '#36a64f',
        title: 'New Development Plan Created',
        fields: [
          { title: 'Problem', value: problem, short: false },
          { title: 'Tasks Generated', value: taskCount.toString(), short: true },
          { title: 'Status', value: 'Ready for execution', short: true }
        ]
      }
    ]
  };

  return await sendSlackMessage(message, config);
};

// Send PR created notification
export const sendPRCreated = async (
  taskTitle: string,
  prUrl: string,
  filename: string,
  config?: SlackConfig
): Promise<boolean> => {
  const message: SlackMessage = {
    text: `:rocket: Pull Request Created!`,
    attachments: [
      {
        color: '#36a64f',
        title: `🤖 ${taskTitle}`,
        title_link: prUrl,
        fields: [
          { title: 'Generated File', value: filename, short: true },
          { title: 'Action Required', value: 'Review and merge', short: true }
        ]
      }
    ]
  };

  return await sendSlackMessage(message, config);
};

// Get Slack integration status
export const getSlackStatus = (config?: SlackConfig) => {
  const webhookUrl = config?.webhookUrl || process.env.SLACK_WEBHOOK_URL;
  
  return {
    name: 'Slack Integration',
    status: webhookUrl ? 'ready' : 'not_configured',
    capabilities: ['notifications', 'status_updates'],
    slackEnabled: !!webhookUrl
  };
};
