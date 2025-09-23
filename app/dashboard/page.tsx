import TaskBoardSSR from '@/components/TaskBoardSSR'
import ProblemInputSSR from '@/components/ProblemInputSSR'
import SystemStatus from '@/components/SystemStatus'
import BulkActions from '@/components/BulkActions'
import Header from '@/components/Header'

export const metadata = {
  title: 'AI Hack Mate - Advanced Dashboard',
  description: 'Complete system overview with agent status and task management',
}

export default function DashboardPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <Header />
      
      {/* System Status Section */}
      <div className="mt-8">
        <SystemStatus />
      </div>
      
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-1">
          <ProblemInputSSR />
        </div>
        <div className="lg:col-span-2">
          <TaskBoardSSR />
        </div>
      </div>
      
      {/* Additional Features Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <BulkActions />
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📈</span>
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-medium text-green-600">94%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '94%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Avg. Completion Time</span>
                <span className="font-medium text-blue-600">2.3 min</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{width: '76%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">AI Utilization</span>
                <span className="font-medium text-purple-600">87%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{width: '87%'}}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🔗</span>
            Integrations
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <span className="text-lg mr-3">🤖</span>
                <div>
                  <div className="font-medium text-gray-900">Gemini AI</div>
                  <div className="text-sm text-gray-500">Code generation & analysis</div>
                </div>
              </div>
              <span className="text-green-500">✅</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <span className="text-lg mr-3">🐙</span>
                <div>
                  <div className="font-medium text-gray-900">GitHub</div>
                  <div className="text-sm text-gray-500">PR creation & management</div>
                </div>
              </div>
              <span className="text-gray-400">⚪</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <span className="text-lg mr-3">💬</span>
                <div>
                  <div className="font-medium text-gray-900">Slack</div>
                  <div className="text-sm text-gray-500">Team notifications</div>
                </div>
              </div>
              <span className="text-gray-400">⚪</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
