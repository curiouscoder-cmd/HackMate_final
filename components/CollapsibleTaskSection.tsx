'use client'

import { useState } from 'react'
import TaskCard from './TaskCard'
import { Task } from '@/lib/agents/planner-agent'

interface CollapsibleTaskSectionProps {
  status: string
  title: string
  color: string
  tasks: Task[]
  count: number
}

export default function CollapsibleTaskSection({ 
  status, 
  title, 
  color, 
  tasks, 
  count 
}: CollapsibleTaskSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className={`rounded-lg border-2 ${color} p-4`}>
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer hover:bg-black/5 rounded-lg p-2 -m-2 transition-colors duration-200 select-none"
        onClick={toggleExpanded}
      >
        <div className="flex items-center space-x-3">
          <div className={`transform transition-transform duration-200 text-gray-600 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {count} {count === 1 ? 'task' : 'tasks'}
          </span>
          <span className="text-xs text-gray-400">
            {isExpanded ? 'Click to collapse' : 'Click to expand'}
          </span>
        </div>
      </div>
      
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="space-y-2">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <div className="text-2xl mb-2">📭</div>
              <div className="text-sm">No tasks</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
