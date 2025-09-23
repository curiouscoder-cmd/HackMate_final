'use client'

import { useState } from 'react'

export default function ProblemInput() {
  const [problem, setProblem] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!problem.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problem: problem.trim() }),
      })

      if (response.ok) {
        setProblem('')
        // Trigger task board refresh
        window.dispatchEvent(new CustomEvent('taskCreated'))
      }
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const exampleProblems = [
    "Add a /health endpoint to the API",
    "Implement user authentication with JWT",
    "Create a responsive dashboard component",
    "Add unit tests for the user service",
    "Set up CI/CD pipeline with GitHub Actions"
  ]

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        🎯 Problem Statement
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="problem" className="block text-sm font-medium text-gray-700 mb-2">
            Describe what you want to build or fix:
          </label>
          <textarea
            id="problem"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="e.g., Add a /health endpoint to check server status"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            rows={4}
            disabled={isSubmitting}
          />
        </div>
        
        <button
          type="submit"
          disabled={!problem.trim() || isSubmitting}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Tasks...
            </span>
          ) : (
            '🚀 Start Planning'
          )}
        </button>
      </form>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">💡 Example Problems:</h3>
        <div className="space-y-2">
          {exampleProblems.map((example, index) => (
            <button
              key={index}
              onClick={() => setProblem(example)}
              className="w-full text-left text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 p-2 rounded-md transition-colors duration-200"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
