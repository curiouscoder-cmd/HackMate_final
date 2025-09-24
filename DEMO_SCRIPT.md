# 🚀 HackMate Demo Script (90-120 seconds)

## Pre-Demo Setup (5 minutes before)
1. **Environment Variables**: Ensure `.env.local` has:
   - `GEMINI_API_KEY` (required)
   - `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO` (for PR creation)
   - `SLACK_WEBHOOK_URL` (for notifications)

2. **Terminal Setup**: Open 3 terminals in Warp:
   - Terminal 1: Frontend (`npm run dev`)
   - Terminal 2: Backend/logs monitoring
   - Terminal 3: Slack/GitHub verification

3. **Browser Setup**: 
   - Tab 1: HackMate app (localhost:3000)
   - Tab 2: GitHub repo (for PR verification)
   - Tab 3: Slack channel (for notifications)

## Demo Flow (90-120 seconds)

### Opening Hook (15 seconds)
> "What if AI could not just write code, but manage entire development projects autonomously? Meet HackMate - an AI development team that goes from problem to pull request in minutes."

### Live Demo (75 seconds)

#### 1. Problem Input (15 seconds)
- Navigate to HackMate dashboard
- Enter problem: **"Add a /health endpoint to check server status"**
- Click "Start Planning"
- **Show**: Real-time task creation in the UI

#### 2. Autonomous Planning (20 seconds)
- **Point out**: AI Planner breaking down the problem into tasks
- **Show**: Task board populating with:
  - ✅ Analyze Requirements (Planner Agent)
  - ⚡ Generate Implementation (Coder Agent) 
  - 🔧 Test and Debug (Debugger Agent)
  - 📢 Update Documentation (PM Agent)
- **Highlight**: Each task assigned to specialized AI agents

#### 3. Code Generation & GitHub PR (25 seconds)
- **Watch**: Coder Agent task moves to "In Progress"
- **Show**: Generated code appears in logs
- **Switch to GitHub tab**: Live PR creation
- **Highlight**: 
  - Automated branch creation
  - Generated `/health` endpoint code
  - Professional PR description with AI attribution

#### 4. Slack Notifications (10 seconds)
- **Switch to Slack**: Show real-time notifications:
  - "🧠 Planning Complete! 4 tasks generated"
  - "⚡ Task started: Generate Implementation"
  - "🚀 Pull Request Created: Add /health endpoint"
- **Emphasize**: Full team visibility without human intervention

#### 5. Task Completion (5 seconds)
- **Back to HackMate**: Show tasks moving to "Done"
- **Point out**: Complete audit trail in task logs

### Closing Impact (15 seconds)
> "In under 2 minutes, HackMate went from problem statement to production-ready code with a GitHub PR and team notifications. This is autonomous development - AI agents that don't just assist, but execute entire development workflows."

### Judge Q&A Prep
**Expected Questions & Answers:**

**Q: "How is this different from GitHub Copilot?"**
A: "Copilot assists individual developers. HackMate replaces entire development workflows - it plans, codes, creates PRs, manages tasks, and communicates with teams autonomously."

**Q: "What about code quality and testing?"**
A: "Each agent specializes in their domain. The Debugger Agent runs tests and analyzes code quality. The system maintains full traceability and can iterate on feedback."

**Q: "How does it handle complex projects?"**
A: "The Planner Agent breaks complex problems into manageable tasks. The memory system learns from previous decisions. For the MVP, we focused on the core autonomous loop - but it's designed to scale."

## Technical Highlights for Judges
- **Real Autonomy**: End-to-end workflow without human intervention
- **Multi-Agent Architecture**: Specialized AI agents with distinct capabilities
- **Production Integration**: Real GitHub PRs, Slack notifications, not just demos
- **Memory System**: Learns from previous decisions and context
- **Scalable Design**: Built for enterprise development workflows

## Fallback Plan
If live demo fails:
1. **Pre-recorded video** (60 seconds) showing the full flow
2. **Static screenshots** with narration
3. **Code walkthrough** of the agent architecture

## Success Metrics
- **Wow Factor**: Autonomous PR creation in real-time
- **Technical Depth**: Multi-agent orchestration with real integrations
- **Business Value**: Clear ROI for development teams
- **Scalability**: Architecture that extends beyond the demo

---

**Remember**: Judges remember the "wow moment" - focus on the autonomous GitHub PR creation. That's your winning moment.
