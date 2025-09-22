const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { TaskRunner } = require('./core/TaskRunner');
const { setupRoutes } = require('./routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize TaskRunner
const taskRunner = new TaskRunner();

// Setup routes
setupRoutes(app, taskRunner);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    agents: taskRunner.getAgentStatus()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Hack Mate server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:3000`);
  console.log(`🔧 API: http://localhost:${PORT}`);
  
  // Initialize agents
  taskRunner.initialize().then(() => {
    console.log('✅ All agents initialized successfully');
  }).catch(error => {
    console.error('❌ Failed to initialize agents:', error);
  });
});

module.exports = app;
