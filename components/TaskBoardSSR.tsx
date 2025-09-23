import { Suspense } from 'react';
import { getTasksAction } from '@/lib/actions/task-actions';
import TaskCard from './TaskCard';
import { Task } from '@/lib/agents/planner-agent';

// Server component for SSR task board
async function TaskBoardContent() {
  const result = await getTasksAction();
  
  if (!result.success || !result.tasks) {
    return (
      <div className="card">
        <div className="text-center py-8 text-red-500">
          <div className="text-2xl mb-2">❌</div>
          <div className="text-sm">Failed to load tasks: {result.error}</div>
        </div>
      </div>
    );
  }

  const tasks = result.tasks;
  const tasksByStatus = {
    queued: tasks.filter(task => task.status === 'queued'),
    in_progress: tasks.filter(task => task.status === 'in_progress'),
    done: tasks.filter(task => task.status === 'done'),
    failed: tasks.filter(task => task.status === 'failed'),
  };

  const statusConfig = {
    queued: { title: '📋 Queued', color: 'bg-gray-50 border-gray-200' },
    in_progress: { title: '⚡ In Progress', color: 'bg-blue-50 border-blue-200' },
    done: { title: '✅ Done', color: 'bg-green-50 border-green-200' },
    failed: { title: '❌ Failed', color: 'bg-red-50 border-red-200' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          📊 Live Task Board
        </h2>
        <div className="text-sm text-gray-500">
          {tasks.length} total tasks
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div key={status} className={`rounded-lg border-2 ${config.color} p-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">{config.title}</h3>
              <span className="text-sm text-gray-500">
                {tasksByStatus[status as keyof typeof tasksByStatus].length}
              </span>
            </div>
            
            <div className="space-y-3">
              {tasksByStatus[status as keyof typeof tasksByStatus].map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
              
              {tasksByStatus[status as keyof typeof tasksByStatus].length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-2xl mb-2">📭</div>
                  <div className="text-sm">No tasks</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Loading component
function TaskBoardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border-2 bg-gray-50 border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
            </div>
            <div className="space-y-3">
              {[...Array(2)].map((_, j) => (
                <div key={j} className="h-24 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main SSR TaskBoard component
export default function TaskBoardSSR() {
  return (
    <Suspense fallback={<TaskBoardLoading />}>
      <TaskBoardContent />
    </Suspense>
  );
}
