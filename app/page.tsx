import TaskBoard from '@/components/TaskBoard'
import ProblemInput from '@/components/ProblemInput'
import Header from '@/components/Header'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <Header />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-1">
          <ProblemInput />
        </div>
        <div className="lg:col-span-2">
          <TaskBoard />
        </div>
      </div>
    </main>
  )
}
