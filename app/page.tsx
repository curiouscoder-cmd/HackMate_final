import TaskBoardSSR from '@/components/TaskBoardSSR'
import ProblemInputSSR from '@/components/ProblemInputSSR'
import Header from '@/components/Header'

export const metadata = {
  title: 'AI Hack Mate - Dashboard',
  description: 'Multi-agent system for automated software development',
}

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="w-full px-6 py-8">
        <Header />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-1">
            <ProblemInputSSR />
          </div>
          <div className="lg:col-span-2">
            <TaskBoardSSR />
          </div>
        </div>
      </div>
    </main>
  )
}
