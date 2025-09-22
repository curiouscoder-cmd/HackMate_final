const express = require('express');

function setupRoutes(app, taskRunner) {
  const router = express.Router();

  // Task management routes
  router.post('/tasks/create', async (req, res) => {
    try {
      const { problem } = req.body;
      
      if (!problem || typeof problem !== 'string') {
        return res.status(400).json({ error: 'Problem statement is required' });
      }

      const taskId = await taskRunner.createTaskFromProblem(problem.trim());
      
      res.json({ 
        success: true, 
        taskId,
        message: 'Task creation initiated' 
      });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/tasks', async (req, res) => {
    try {
      const tasks = await taskRunner.getAllTasks();
      res.json({ tasks });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/tasks/:id', async (req, res) => {
    try {
      const task = await taskRunner.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({ task });
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/tasks/:id/retry', async (req, res) => {
    try {
      await taskRunner.retryTask(req.params.id);
      res.json({ success: true, message: 'Task retry initiated' });
    } catch (error) {
      console.error('Error retrying task:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Agent status routes
  router.get('/agents/status', (req, res) => {
    try {
      const status = taskRunner.getAgentStatus();
      res.json({ agents: status });
    } catch (error) {
      console.error('Error getting agent status:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Memory routes
  router.get('/memory/search', async (req, res) => {
    try {
      const { query, limit = 10 } = req.query;
      const results = await taskRunner.searchMemory(query, parseInt(limit));
      res.json({ results });
    } catch (error) {
      console.error('Error searching memory:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mount all routes under /api
  app.use('/api', router);
}

module.exports = { setupRoutes };
