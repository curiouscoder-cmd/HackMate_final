import { Task } from '../agents/planner-agent';

export interface MemoryEntry {
  id: string;
  type: 'task' | 'decision' | 'code' | 'error';
  content: string;
  metadata: any;
  timestamp: string;
  embedding?: number[];
}

export class MemoryManager {
  private memories: Map<string, MemoryEntry> = new Map();
  private chromaClient: any = null;
  private collectionName = 'hackmate_memory';

  constructor() {
    this.initializeChroma();
  }

  private async initializeChroma() {
    try {
      // Only initialize ChromaDB if URL is provided
      const chromaUrl = process.env.CHROMA_URL;
      if (!chromaUrl) {
        console.log('ChromaDB not configured, using in-memory storage');
        return;
      }

      // Dynamic import to avoid issues if chromadb is not installed
      const { ChromaApi, Configuration } = await import('chromadb');
      
      this.chromaClient = new ChromaApi(new Configuration({
        basePath: chromaUrl
      }));

      console.log('✅ ChromaDB connected successfully');
    } catch (error) {
      console.warn('ChromaDB not available, using fallback memory storage:', error.message);
      this.chromaClient = null;
    }
  }

  async initialize(): Promise<void> {
    if (this.chromaClient) {
      try {
        // Create or get collection
        await this.chromaClient.createCollection({
          name: this.collectionName,
          metadata: { description: 'HackMate AI memory storage' }
        });
      } catch (error) {
        // Collection might already exist
        console.log('ChromaDB collection already exists or error:', error.message);
      }
    }
  }

  async storeTask(task: Task): Promise<void> {
    const memoryEntry: MemoryEntry = {
      id: `task_${task.id}`,
      type: 'task',
      content: `${task.title}\n${task.description}\nAgent: ${task.agent}\nStatus: ${task.status}`,
      metadata: {
        taskId: task.id,
        agent: task.agent,
        status: task.status,
        createdAt: task.createdAt,
        ...task.metadata
      },
      timestamp: new Date().toISOString()
    };

    // Store in local memory
    this.memories.set(memoryEntry.id, memoryEntry);

    // Store in ChromaDB if available
    if (this.chromaClient) {
      try {
        await this.chromaClient.add({
          collectionName: this.collectionName,
          ids: [memoryEntry.id],
          documents: [memoryEntry.content],
          metadatas: [memoryEntry.metadata]
        });
      } catch (error) {
        console.warn('Failed to store in ChromaDB:', error.message);
      }
    }
  }

  async storeDecision(decision: string, context: any): Promise<void> {
    const memoryEntry: MemoryEntry = {
      id: `decision_${Date.now()}`,
      type: 'decision',
      content: decision,
      metadata: {
        context,
        importance: 'high'
      },
      timestamp: new Date().toISOString()
    };

    this.memories.set(memoryEntry.id, memoryEntry);

    if (this.chromaClient) {
      try {
        await this.chromaClient.add({
          collectionName: this.collectionName,
          ids: [memoryEntry.id],
          documents: [memoryEntry.content],
          metadatas: [memoryEntry.metadata]
        });
      } catch (error) {
        console.warn('Failed to store decision in ChromaDB:', error.message);
      }
    }
  }

  async storeCode(filename: string, code: string, description: string): Promise<void> {
    const memoryEntry: MemoryEntry = {
      id: `code_${filename}_${Date.now()}`,
      type: 'code',
      content: `File: ${filename}\nDescription: ${description}\nCode:\n${code}`,
      metadata: {
        filename,
        description,
        language: this.detectLanguage(filename)
      },
      timestamp: new Date().toISOString()
    };

    this.memories.set(memoryEntry.id, memoryEntry);

    if (this.chromaClient) {
      try {
        await this.chromaClient.add({
          collectionName: this.collectionName,
          ids: [memoryEntry.id],
          documents: [memoryEntry.content],
          metadatas: [memoryEntry.metadata]
        });
      } catch (error) {
        console.warn('Failed to store code in ChromaDB:', error.message);
      }
    }
  }

  async searchTasks(query: string, limit: number = 10): Promise<any[]> {
    if (this.chromaClient) {
      try {
        const results = await this.chromaClient.query({
          collectionName: this.collectionName,
          queryTexts: [query],
          nResults: limit,
          where: { type: 'task' }
        });

        return results.documents[0]?.map((doc: string, index: number) => ({
          content: doc,
          metadata: results.metadatas[0][index],
          distance: results.distances[0][index]
        })) || [];
      } catch (error) {
        console.warn('ChromaDB search failed, using fallback:', error.message);
      }
    }

    // Fallback: simple text search in local memory
    const results = Array.from(this.memories.values())
      .filter(entry => 
        entry.type === 'task' && 
        entry.content.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit)
      .map(entry => ({
        content: entry.content,
        metadata: entry.metadata,
        distance: 0 // No distance calculation for simple search
      }));

    return results;
  }

  async searchByType(type: MemoryEntry['type'], limit: number = 10): Promise<MemoryEntry[]> {
    if (this.chromaClient) {
      try {
        const results = await this.chromaClient.query({
          collectionName: this.collectionName,
          queryTexts: [''],
          nResults: limit,
          where: { type }
        });

        return results.documents[0]?.map((doc: string, index: number) => ({
          id: results.ids[0][index],
          type,
          content: doc,
          metadata: results.metadatas[0][index],
          timestamp: results.metadatas[0][index].timestamp || new Date().toISOString()
        })) || [];
      } catch (error) {
        console.warn('ChromaDB type search failed, using fallback:', error.message);
      }
    }

    // Fallback: filter local memory
    return Array.from(this.memories.values())
      .filter(entry => entry.type === type)
      .slice(0, limit);
  }

  async getRecentMemories(limit: number = 20): Promise<MemoryEntry[]> {
    const localMemories = Array.from(this.memories.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return localMemories;
  }

  private detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin'
    };

    return languageMap[ext || ''] || 'unknown';
  }

  getStatus() {
    return {
      name: 'Memory Manager',
      status: 'ready',
      capabilities: ['task_storage', 'semantic_search', 'decision_tracking'],
      chromaEnabled: !!this.chromaClient,
      localMemories: this.memories.size,
      types: ['task', 'decision', 'code', 'error']
    };
  }

  async shutdown(): Promise<void> {
    // Clean up connections if needed
    this.chromaClient = null;
    console.log('Memory Manager shutdown complete');
  }
}
