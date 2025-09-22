'use client'

import { useState, useEffect } from 'react'

export default function Header() {
  const [agentStatus, setAgentStatus] = useState({
    planner: 'idle',
    coder: 'idle',
    debugger: 'idle',
    pm: 'idle'
  })

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              🤖 AI Hack Mate
            </h1>
            <span className="ml-3 text-sm text-gray-500">
              Multi-Agent Development System
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Agents:</span>
              {Object.entries(agentStatus).map(([agent, status]) => (
                <div key={agent} className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    status === 'active' ? 'bg-green-500' :
                    status === 'working' ? 'bg-yellow-500 animate-pulse' :
                    'bg-gray-300'
                  }`} />
                  <span className="text-xs text-gray-600 capitalize">{agent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
