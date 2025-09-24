#!/bin/bash

# HackMate MVP Setup Script
# Run this to quickly set up your environment for the demo

echo "🚀 Setting up HackMate MVP..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📋 Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ Created .env.local"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local and add your API keys:"
    echo "   - GEMINI_API_KEY (required)"
    echo "   - GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO (for PR creation)"
    echo "   - SLACK_WEBHOOK_URL (for notifications)"
    echo ""
else
    echo "✅ .env.local already exists"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Check environment variables
echo "🔍 Checking environment configuration..."
source .env.local 2>/dev/null || true

check_env() {
    local var_name=$1
    local var_value=${!var_name}
    if [ -n "$var_value" ]; then
        echo "  ✅ $var_name: ${var_value:0:10}..."
    else
        echo "  ❌ $var_name: Not set"
    fi
}

check_env "GEMINI_API_KEY"
check_env "GITHUB_TOKEN"
check_env "GITHUB_OWNER"
check_env "GITHUB_REPO"
check_env "SLACK_WEBHOOK_URL"

echo ""

# Quick API key setup instructions
if [ -z "$GEMINI_API_KEY" ]; then
    echo "🔑 To get your Gemini API key:"
    echo "   1. Go to https://makersuite.google.com/app/apikey"
    echo "   2. Create a new API key"
    echo "   3. Add it to .env.local as GEMINI_API_KEY=your_key_here"
    echo ""
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "🔑 To set up GitHub integration:"
    echo "   1. Go to https://github.com/settings/tokens"
    echo "   2. Create a Personal Access Token with 'repo' permissions"
    echo "   3. Add to .env.local:"
    echo "      GITHUB_TOKEN=your_token_here"
    echo "      GITHUB_OWNER=your_username"
    echo "      GITHUB_REPO=your_repo_name"
    echo ""
fi

if [ -z "$SLACK_WEBHOOK_URL" ]; then
    echo "🔑 To set up Slack notifications:"
    echo "   1. Go to https://api.slack.com/messaging/webhooks"
    echo "   2. Create a new webhook for your channel"
    echo "   3. Add to .env.local as SLACK_WEBHOOK_URL=your_webhook_url"
    echo ""
fi

# Create demo repository if GitHub is configured
if [ -n "$GITHUB_TOKEN" ] && [ -n "$GITHUB_OWNER" ] && [ -n "$GITHUB_REPO" ]; then
    echo "🔧 GitHub is configured. Make sure your repository exists:"
    echo "   Repository: https://github.com/$GITHUB_OWNER/$GITHUB_REPO"
    echo ""
fi

echo "🎯 Next steps:"
echo "   1. Fill in missing API keys in .env.local"
echo "   2. Run: npm run dev"
echo "   3. Open: http://localhost:3000"
echo "   4. Test the flow with: 'Add a /health endpoint'"
echo ""
echo "🎬 For demo day:"
echo "   1. Open 3 browser tabs: HackMate, GitHub repo, Slack channel"
echo "   2. Follow the DEMO_SCRIPT.md for the 90-second presentation"
echo ""
echo "✅ Setup complete! Good luck with your demo! 🚀"
