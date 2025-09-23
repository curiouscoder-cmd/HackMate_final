export interface MemoryEntry {
  id: string;
  type: 'task' | 'decision' | 'code' | 'error';
  content: string;
  metadata: any;
  timestamp: string;
  embedding?: number[];
}

export class MemoryManager {
  private inMemoryStore: MemoryEntry[] = [];
  private maxEntries = 1000; // Limit memory usage

  constructor() {
    console.log('📝 Memory Manager initialized (in-memory mode)');
  }

  async initialize(): Promise<void> {
    // No initialization needed for in-memory storage
    console.log('✅ Memory Manager ready');
  }

  async store(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): Promise<string> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const memoryEntry: MemoryEntry = {
      id,
      timestamp: new Date().toISOString(),
      ...entry
    };

    this.inMemoryStore.push(memoryEntry);

    // Keep only the most recent entries
    if (this.inMemoryStore.length > this.maxEntries) {
      this.inMemoryStore = this.inMemoryStore.slice(-this.maxEntries);
    }

    return id;
  }

  async retrieve(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    // Simple text-based search since we don't have vector embeddings
    const queryLower = query.toLowerCase();
    
    const matches = this.inMemoryStore.filter(entry => 
      entry.content.toLowerCase().includes(queryLower) ||
      entry.metadata?.tags?.some((tag: string) => tag.toLowerCase().includes(queryLower))
    );

    // Sort by timestamp (most recent first)
    matches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return matches.slice(0, limit);
  }

  async update(id: string, updates: Partial<MemoryEntry>): Promise<boolean> {
    const index = this.inMemoryStore.findIndex(entry => entry.id === id);
    if (index === -1) return false;

    this.inMemoryStore[index] = {
      ...this.inMemoryStore[index],
      ...updates,
      id, // Ensure ID doesn't change
      timestamp: new Date().toISOString() // Update timestamp
    };

    return true;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.inMemoryStore.findIndex(entry => entry.id === id);
    if (index === -1) return false;

    this.inMemoryStore.splice(index, 1);
    return true;
  }

  async getByType(type: MemoryEntry['type'], limit: number = 10): Promise<MemoryEntry[]> {
    const matches = this.inMemoryStore.filter(entry => entry.type === type);
    
    // Sort by timestamp (most recent first)
    matches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return matches.slice(0, limit);
  }

  async getRecent(limit: number = 10): Promise<MemoryEntry[]> {
    const sorted = [...this.inMemoryStore].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return sorted.slice(0, limit);
  }

  async clear(): Promise<void> {
    this.inMemoryStore = [];
    console.log('🧹 Memory cleared');
  }

  async getStats(): Promise<{
    totalEntries: number;
    entriesByType: Record<string, number>;
    oldestEntry?: string;
    newestEntry?: string;
  }> {
    const entriesByType: Record<string, number> = {};
    
    this.inMemoryStore.forEach(entry => {
      entriesByType[entry.type] = (entriesByType[entry.type] || 0) + 1;
    });

    const timestamps = this.inMemoryStore.map(entry => entry.timestamp).sort();

    return {
      totalEntries: this.inMemoryStore.length,
      entriesByType,
      oldestEntry: timestamps[0],
      newestEntry: timestamps[timestamps.length - 1]
    };
  }

  // Helper method to add context about a task
  async addTaskContext(taskId: string, context: string, metadata: any = {}): Promise<string> {
    return this.store({
      type: 'task',
      content: context,
      metadata: {
        taskId,
        ...metadata
      }
    });
  }

  // Helper method to add decision context
  async addDecision(decision: string, reasoning: string, metadata: any = {}): Promise<string> {
    return this.store({
      type: 'decision',
      content: `Decision: ${decision}\nReasoning: ${reasoning}`,
      metadata
    });
  }

  // Helper method to add code context
  async addCodeContext(code: string, description: string, metadata: any = {}): Promise<string> {
    return this.store({
      type: 'code',
      content: `${description}\n\n\`\`\`\n${code}\n\`\`\``,
      metadata
    });
  }

  // Helper method to add error context
  async addError(error: string, context: string, metadata: any = {}): Promise<string> {
    return this.store({
      type: 'error',
      content: `Error: ${error}\nContext: ${context}`,
      metadata
    });
  }

  // Get context for a specific task
  async getTaskContext(taskId: string): Promise<MemoryEntry[]> {
    return this.inMemoryStore.filter(entry => 
      entry.metadata?.taskId === taskId
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
