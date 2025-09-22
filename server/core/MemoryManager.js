const { ChromaClient } = require('chromadb');

class MemoryManager {
  constructor() {
    this.client = null;
    this.collection = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize ChromaDB client
      this.client = new ChromaClient({
        path: process.env.CHROMA_URL || 'http://localhost:8000'
      });

      // Get or create collection
      try {
        this.collection = await this.client.getCollection({
          name: 'hackmate_memory'
        });
      } catch (error) {
        // Collection doesn't exist, create it
        this.collection = await this.client.createCollection({
          name: 'hackmate_memory',
          metadata: { description: 'AI Hack Mate memory storage' }
        });
      }

      this.isInitialized = true;
      console.log('✅ MemoryManager initialized with ChromaDB');
    } catch (error) {
      console.warn('⚠️ ChromaDB not available, using in-memory storage');
      // Fallback to in-memory storage
      this.memoryStore = new Map();
      this.isInitialized = true;
    }
  }

  async store(id, content, metadata = {}) {
    if (!this.isInitialized) {
      throw new Error('MemoryManager not initialized');
    }

    try {
      if (this.collection) {
        // Use ChromaDB
        await this.collection.add({
          ids: [id],
          documents: [content],
          metadatas: [metadata]
        });
      } else {
        // Use in-memory storage
        this.memoryStore.set(id, { content, metadata, timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Error storing memory:', error);
      throw error;
    }
  }

  async search(query, limit = 10) {
    if (!this.isInitialized) {
      throw new Error('MemoryManager not initialized');
    }

    try {
      if (this.collection) {
        // Use ChromaDB semantic search
        const results = await this.collection.query({
          queryTexts: [query],
          nResults: limit
        });

        return results.documents[0].map((doc, index) => ({
          content: doc,
          metadata: results.metadatas[0][index],
          distance: results.distances[0][index]
        }));
      } else {
        // Simple text search in memory
        const results = [];
        for (const [id, data] of this.memoryStore.entries()) {
          if (data.content.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              id,
              content: data.content,
              metadata: data.metadata,
              timestamp: data.timestamp
            });
          }
        }
        return results.slice(0, limit);
      }
    } catch (error) {
      console.error('Error searching memory:', error);
      return [];
    }
  }

  async get(id) {
    if (!this.isInitialized) {
      throw new Error('MemoryManager not initialized');
    }

    try {
      if (this.collection) {
        const results = await this.collection.get({
          ids: [id]
        });
        
        if (results.documents.length > 0) {
          return {
            content: results.documents[0],
            metadata: results.metadatas[0]
          };
        }
      } else {
        return this.memoryStore.get(id);
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving memory:', error);
      return null;
    }
  }

  async storeTaskContext(taskId, context) {
    const id = `task_${taskId}`;
    await this.store(id, JSON.stringify(context), {
      type: 'task_context',
      taskId,
      timestamp: Date.now()
    });
  }

  async storeCodeGeneration(taskId, code, language = 'javascript') {
    const id = `code_${taskId}_${Date.now()}`;
    await this.store(id, code, {
      type: 'code_generation',
      taskId,
      language,
      timestamp: Date.now()
    });
  }

  async storePlanningDecision(taskId, decision, reasoning) {
    const id = `planning_${taskId}_${Date.now()}`;
    await this.store(id, `Decision: ${decision}\nReasoning: ${reasoning}`, {
      type: 'planning_decision',
      taskId,
      decision,
      timestamp: Date.now()
    });
  }
}

module.exports = { MemoryManager };
