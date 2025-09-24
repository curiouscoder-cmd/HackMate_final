// Quick Slack integration test
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function testSlack() {
  console.log('🧪 Testing Slack integration...');
  console.log('Webhook URL:', process.env.SLACK_WEBHOOK_URL ? 'Set' : 'Not set');
  
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('❌ SLACK_WEBHOOK_URL not set');
    return;
  }
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '🧪 HackMate Slack Integration Test - Task Started!',
        username: 'HackMate Bot',
        icon_emoji: ':robot_face:'
      })
    });
    
    if (response.ok) {
      console.log('✅ Slack notification sent successfully!');
    } else {
      console.error('❌ Slack API error:', response.status);
    }
  } catch (error) {
    console.error('❌ Slack test failed:', error.message);
  }
}

testSlack();
