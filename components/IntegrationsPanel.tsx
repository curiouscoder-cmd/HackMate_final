'use client'

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface Integration {
  name: string
  description: string
  icon: string
  status: 'connected' | 'disconnected' | 'checking'
  color: string
  details?: string
}

export default function IntegrationsPanel() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      name: 'Gemini AI',
      description: 'Code generation & analysis',
      icon: '🤖',
      status: 'checking',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'GitHub',
      description: 'PR creation & management',
      icon: '🐙',
      status: 'checking',
      color: 'from-gray-700 to-gray-900'
    },
    {
      name: 'Slack',
      description: 'Team notifications',
      icon: '💬',
      status: 'checking',
      color: 'from-purple-500 to-pink-500'
    }
  ]);

  const checkIntegrations = async () => {
    try {
      // Check environment variables and API status
      const hasGemini = !!process.env.NEXT_PUBLIC_GEMINI_API_KEY || typeof window !== 'undefined';
      const hasGitHub = typeof window !== 'undefined'; // We'll check via API
      const hasSlack = typeof window !== 'undefined'; // We'll check via API
      
      // For client-side, we'll make API calls to check status
      const response = await fetch('/api/agents/status');
      const result = await response.json();
      
      setIntegrations(prev => prev.map(integration => {
        switch (integration.name) {
          case 'Gemini AI':
            return {
              ...integration,
              status: result.success && result.agents?.config?.enableAI ? 'connected' : 'disconnected',
              details: result.success && result.agents?.config?.enableAI ? 'API Key configured' : 'API Key missing'
            };
          case 'GitHub':
            return {
              ...integration,
              status: result.success && result.agents?.config?.enableGitHub ? 'connected' : 'disconnected',
              details: result.success && result.agents?.config?.enableGitHub ? 'Token configured' : 'Token missing'
            };
          case 'Slack':
            return {
              ...integration,
              status: result.success && result.agents?.config?.enableSlack ? 'connected' : 'disconnected',
              details: result.success && result.agents?.config?.enableSlack ? 'Webhook configured' : 'Webhook missing'
            };
          default:
            return integration;
        }
      }));
    } catch (error) {
      console.error('Failed to check integrations:', error);
      setIntegrations(prev => prev.map(integration => ({
        ...integration,
        status: 'disconnected' as const,
        details: 'Check failed'
      })));
    }
  };

  useEffect(() => {
    checkIntegrations();
    
    // Refresh integration status every 10 seconds
    const interval = setInterval(checkIntegrations, 10000);
    
    return () => clearInterval(interval);
  }, []);

function IntegrationCard({ integration, index }: { integration: Integration; index: number }) {
  return (
    <div className={`group relative overflow-hidden rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 fade-in`}
         style={{ animationDelay: `${index * 150}ms` }}>
      
      {/* Background gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r ${integration.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 bg-gradient-to-r ${integration.color} rounded-lg flex items-center justify-center text-white shadow-lg`}>
            <span className="text-lg">{integration.icon}</span>
          </div>
          <div>
            <div className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
              {integration.name}
            </div>
            <div className="text-sm text-gray-500">
              {integration.description}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {integration.status === 'connected' ? (
            <>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Connected
              </span>
            </>
          ) : integration.status === 'checking' ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                Checking...
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                Disconnected
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* Connection details */}
      {integration.details && (
        <div className="mt-2 text-xs text-gray-400">
          {integration.details}
        </div>
      )}
    </div>
  )
}

  return (
    <div className="premium-card fade-in stagger-3">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
          <span className="text-white text-lg">🔗</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Integrations</h3>
          <p className="text-sm text-gray-500">Connected services & tools</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {integrations.map((integration, index) => (
          <IntegrationCard 
            key={integration.name} 
            integration={integration} 
            index={index}
          />
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium py-2 px-4 rounded-lg hover:bg-indigo-50 transition-colors duration-200">
          + Add New Integration
        </button>
      </div>
    </div>
  )
}
