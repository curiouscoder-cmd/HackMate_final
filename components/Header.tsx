'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const pathname = usePathname()
  const [agentStatus, setAgentStatus] = useState({
    planner: 'idle',
    coder: 'idle',
    debugger: 'idle',
    pm: 'idle'
  })

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                🤖 AI Hack Mate
              </h1>
              <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                Multi-Agent Development System
              </span>
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/dashboard" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/dashboard' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Agents:</span>
              {Object.entries(agentStatus).map(([agent, status]) => (
                <div key={agent} className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${
                    status === 'active' ? 'bg-green-500' :
                    status === 'working' ? 'bg-yellow-500 animate-pulse' :
                    'bg-gray-300 dark:bg-gray-600'
                  }`} />
                  <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{agent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
