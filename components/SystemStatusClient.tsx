'use client'

import { useState, useEffect } from 'react';
import { Check, X, RefreshCw, Loader2 } from 'lucide-react';

interface AgentStatus {
  taskCount: number;
  config?: {
    enableAI: boolean;
    enableGitHub: boolean;
    enableSlack: boolean;
  };
  memory?: {
    status: string;
  };
}

export default function SystemStatusClient() {
  const [agents, setAgents] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/agents/status');
      const result = await response.json();
      
      if (result.success && result.agents) {
        setAgents(result.agents);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Auto-refresh every 3 seconds
    const interval = setInterval(fetchStatus, 3000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !agents) {
    return (
      <div className="premium-card">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Loading system status...</span>
        </div>
      </div>
    );
  }

  if (error && !agents) {
    return (
      <div className="premium-card border border-red-200 bg-red-50">
        <div className="flex items-center">
          <X className="text-red-500 w-4 h-4 mr-2" />
          <span className="text-foreground font-medium">System Status Unavailable</span>
        </div>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button 
          onClick={() => { setLoading(true); fetchStatus(); }}
          className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </button>
      </div>
    );
  }

  const totalTasks = agents?.taskCount || 0;

  return (
    <div className="premium-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center">
          <span className="mr-2">🔧</span>
          System Status
        </h3>
        <div className="flex items-center text-xs text-muted-foreground">
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
          ) : (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
          )}
          <span>Updated {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Overall System Health */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 rounded-lg bg-muted hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-blue-600 flex items-center justify-center">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : totalTasks}
          </div>
          <div className="text-sm text-muted-foreground">Total Tasks</div>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-muted hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-green-600">
            {agents ? Object.keys(agents).filter(key => key !== 'taskCount' && key !== 'config').length : 0}
          </div>
          <div className="text-sm text-muted-foreground">Active Agents</div>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-muted hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-purple-600">
            {agents?.config?.enableAI ? 
              <Check className="w-5 h-5 text-green-600 inline-block" /> : 
              <X className="w-5 h-5 text-red-600 inline-block" />
            }
          </div>
          <div className="text-sm text-muted-foreground">AI Enabled</div>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-muted hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-orange-600">
            {agents?.memory?.status === 'ready' ? 
              <Check className="w-5 h-5 text-green-600 inline-block" /> : 
              <X className="w-5 h-5 text-red-600 inline-block" />
            }
          </div>
          <div className="text-sm text-muted-foreground">Memory Ready</div>
        </div>
      </div>

      {/* Real-time indicator */}
      <div className="flex items-center justify-center text-xs text-muted-foreground bg-muted/50 rounded-lg py-2">
        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse mr-2"></div>
        Auto-refreshing every 3 seconds
      </div>
    </div>
  );
}
