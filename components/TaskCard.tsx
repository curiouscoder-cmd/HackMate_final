'use client'

import { useState } from 'react'

interface Task {
  id: string
  title: string
  description: string
  status: 'queued' | 'in_progress' | 'done' | 'failed'
  agent: string
  createdAt: string
  updatedAt: string
  logs: string[]
  metadata?: any
}

interface TaskCardProps {
  task: Task
}

export default function TaskCard({ task }: TaskCardProps) {
  const [showLogs, setShowLogs] = useState(false)

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'planner': return '🧠'
      case 'coder': return '👨‍💻'
      case 'debugger': return '🐞'
      case 'pm': return '📣'
      default: return '🤖'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'status-queued'
      case 'in_progress': return 'status-in-progress'
      case 'done': return 'status-done'
      case 'failed': return 'status-failed'
      default: return 'status-queued'
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getAgentIcon(task.agent)}</span>
          <span className="text-xs text-gray-500 capitalize">{task.agent}</span>
        </div>
        <span className={`status-badge ${getStatusColor(task.status)}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>

      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {task.title}
      </h4>

      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
        {task.description}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatTime(task.updatedAt)}</span>
        {task.logs.length > 0 && (
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {showLogs ? 'Hide' : 'Show'} Logs ({task.logs.length})
          </button>
        )}
      </div>

      {showLogs && task.logs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
            {task.logs.map((log, index) => (
              <div key={index} className="text-xs text-gray-700 mb-1 font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {task.metadata?.prUrl && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <a
            href={task.metadata.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-primary-600 hover:text-primary-700"
          >
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            View PR
          </a>
        </div>
      )}
    </div>
  )
}
