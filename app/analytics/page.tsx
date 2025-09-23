import { Suspense } from 'react';
import { getTasksAction } from '@/lib/actions/task-actions';
import { generateAnalytics } from '@/lib/analytics/task-analytics';
import Header from '@/components/Header';

async function AnalyticsContent() {
  const result = await getTasksAction();
  
  if (!result.success || !result.tasks) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <span className="text-red-500 text-lg mr-2">❌</span>
          <span className="text-red-700 dark:text-red-300 font-medium">Analytics Unavailable</span>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm mt-1">{result.error}</p>
      </div>
    );
  }

  const analytics = generateAnalytics(result.tasks);

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{analytics.overview.totalTasks}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics.overview.successRate.toFixed(1)}%</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Time</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analytics.overview.avgCompletionTime.toFixed(1)}m</p>
            </div>
            <div className="text-4xl">⏱️</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cost</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">${analytics.costs.totalCost.toFixed(2)}</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <span className="mr-2">🤖</span>
          Agent Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(analytics.performance.agentPerformance).map(([agent, performance]) => (
            <div key={agent} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 capitalize mb-3">{agent}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Completed</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{performance.tasksCompleted}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{performance.successRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Avg Time</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">{performance.avgTime.toFixed(1)}m</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Cost</span>
                  <span className="font-medium text-purple-600 dark:text-purple-400">${performance.totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Trends */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <span className="mr-2">📈</span>
          Daily Trends (Last 7 Days)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-2 text-gray-600 dark:text-gray-400">Date</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-400">Completed</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-400">Failed</th>
                <th className="text-left py-2 text-gray-600 dark:text-gray-400">Avg Time</th>
              </tr>
            </thead>
            <tbody>
              {analytics.performance.dailyTrends.map((day, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 text-gray-900 dark:text-gray-100">{day.date}</td>
                  <td className="py-2 text-green-600 dark:text-green-400">{day.completed}</td>
                  <td className="py-2 text-red-600 dark:text-red-400">{day.failed}</td>
                  <td className="py-2 text-blue-600 dark:text-blue-400">{day.avgTime.toFixed(1)}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Productivity Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
          <span className="mr-2">💡</span>
          Productivity Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Peak Hours</h4>
            <div className="space-y-2">
              {analytics.productivity.peakHours.map((hour, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{hour}</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">Peak</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Recommendations</h4>
            <div className="space-y-2">
              {analytics.productivity.recommendations.map((rec, index) => (
                <div key={index} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      {analytics.costs.totalCost > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
            <span className="mr-2">💰</span>
            Cost Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">By Model</h4>
              <div className="space-y-2">
                {Object.entries(analytics.costs.costByModel).map(([model, cost]) => (
                  <div key={model} className="flex justify-between items-center p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{model}</span>
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">${cost.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">By Agent</h4>
              <div className="space-y-2">
                {Object.entries(analytics.costs.costByAgent).map(([agent, cost]) => (
                  <div key={agent} className="flex justify-between items-center p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{agent}</span>
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">${cost.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsLoading() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-40 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'AI Hack Mate - Analytics',
  description: 'Advanced analytics and performance metrics for your AI agents',
}

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="w-full px-6 py-8">
        <Header />
        
        <div className="mt-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">📊 Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Comprehensive insights into your AI agent performance and productivity
            </p>
          </div>
          
          <Suspense fallback={<AnalyticsLoading />}>
            <AnalyticsContent />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
