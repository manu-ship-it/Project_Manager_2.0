'use client'

import { useState } from 'react'
import { Check, Plus, Flag } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { useUpdateProjectTask, useCreateProjectTask } from '@/hooks/useProjectTasks'
import { supabase, ProjectTask } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

export default function TasksPage() {
  const { data: projects, isLoading: projectsLoading } = useProjects()
  const updateTask = useUpdateProjectTask()
  const createTask = useCreateProjectTask()

  // Filter non-completed projects
  const nonCompletedProjects = projects?.filter(p => p.status !== 'completed') || []
  const projectIds = nonCompletedProjects.map(p => p.id)

  // Fetch all tasks for non-completed projects
  const { data: allTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['all-tasks', projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return []
      
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as ProjectTask[]
    },
    enabled: projectIds.length > 0,
  })

  // Group tasks by project_id
  const tasksByProject = allTasks?.reduce((acc, task) => {
    if (!acc[task.project_id]) {
      acc[task.project_id] = []
    }
    acc[task.project_id].push(task)
    return acc
  }, {} as Record<string, ProjectTask[]>) || {}

  const handleToggleTask = async (task: ProjectTask) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        is_completed: !task.is_completed,
      })
      // Query invalidation is handled in the useUpdateProjectTask hook
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleAddTask = async (projectId: string, taskDescription: string) => {
    if (!taskDescription.trim()) return
    
    try {
      await createTask.mutateAsync({
        project_id: projectId,
        task_description: taskDescription.trim(),
        is_completed: false,
        is_flagged: false,
      })
      // Query invalidation is handled in the useCreateProjectTask hook
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleToggleFlag = async (task: ProjectTask) => {
    // If trying to flag (not unflag), check the limit
    if (!task.is_flagged) {
      const flaggedCount = allTasks?.filter(t => t.is_flagged).length || 0
      if (flaggedCount >= 3) {
        alert('Maximum of 3 tasks can be flagged at once. Please unflag a task first.')
        return
      }
    }

    try {
      await updateTask.mutateAsync({
        id: task.id,
        is_flagged: !task.is_flagged,
      })
      // Query invalidation is handled in the useUpdateProjectTask hook
    } catch (error) {
      console.error('Error updating task flag:', error)
    }
  }

  // Count flagged tasks across all projects
  const flaggedCount = allTasks?.filter(t => t.is_flagged).length || 0
  const canFlagMore = flaggedCount < 3

  const isLoading = projectsLoading || tasksLoading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage tasks for active projects</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {nonCompletedProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No active projects</h3>
            <p className="text-gray-500">All projects are marked as complete.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {nonCompletedProjects.map((project) => {
              const projectTasks = tasksByProject[project.id] || []
              
              // Sort tasks: flagged first, then incomplete, then completed
              const sortedTasks = [...projectTasks].sort((a, b) => {
                // First priority: flagged tasks
                if (a.is_flagged !== b.is_flagged) {
                  return a.is_flagged ? -1 : 1
                }
                // Second priority: incomplete vs completed
                if (a.is_completed !== b.is_completed) {
                  return a.is_completed ? 1 : -1
                }
                return 0
              })

              return (
                <ProjectTaskSection
                  key={project.id}
                  project={project}
                  tasks={sortedTasks}
                  onToggleTask={handleToggleTask}
                  onToggleFlag={handleToggleFlag}
                  onAddTask={handleAddTask}
                  isUpdating={updateTask.isPending}
                  isCreating={createTask.isPending}
                  canFlagMore={canFlagMore}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

interface ProjectTaskSectionProps {
  project: { id: string; name: string }
  tasks: ProjectTask[]
  onToggleTask: (task: ProjectTask) => void
  onToggleFlag: (task: ProjectTask) => void
  onAddTask: (projectId: string, taskDescription: string) => void
  isUpdating: boolean
  isCreating: boolean
  canFlagMore: boolean
}

function ProjectTaskSection({ 
  project, 
  tasks, 
  onToggleTask,
  onToggleFlag,
  onAddTask, 
  isUpdating,
  isCreating,
  canFlagMore
}: ProjectTaskSectionProps) {
  const [newTaskText, setNewTaskText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTaskText.trim()) {
      onAddTask(project.id, newTaskText)
      setNewTaskText('')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-3">
      <h2 className="text-sm font-semibold text-gray-900 mb-1.5">{project.name}</h2>
      
      {tasks.length === 0 ? (
        <p className="text-xs text-gray-500 italic mb-2">No tasks</p>
      ) : (
        <div className="space-y-0.5 mb-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center space-x-2 px-2 py-1 rounded ${
                task.is_flagged ? 'bg-red-50 border-l-2 border-red-500' : ''
              }`}
            >
              <button
                onClick={() => onToggleTask(task)}
                disabled={isUpdating}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                  task.is_completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-500'
                }`}
              >
                {task.is_completed && <Check className="h-3 w-3" />}
              </button>
              
              <span
                className={`flex-1 text-xs ${
                  task.is_completed
                    ? 'text-gray-500 line-through'
                    : task.is_flagged
                    ? 'text-red-900 font-medium'
                    : 'text-gray-900'
                }`}
              >
                {task.task_description}
              </span>
              
              <button
                onClick={() => onToggleFlag(task)}
                disabled={isUpdating || (!task.is_flagged && !canFlagMore)}
                className={`flex-shrink-0 transition-colors ${
                  task.is_flagged
                    ? 'text-red-600 hover:text-red-700'
                    : !canFlagMore
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-400 hover:text-red-500'
                }`}
                title={
                  task.is_flagged 
                    ? 'Unflag task' 
                    : !canFlagMore 
                    ? 'Maximum of 3 tasks can be flagged'
                    : 'Flag task'
                }
              >
                <Flag className={`h-3 w-3 ${task.is_flagged ? 'fill-current' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Add Task Input */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2 pt-1 border-t border-gray-100">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add new task..."
          className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          disabled={isCreating}
        />
        <button
          type="submit"
          disabled={isCreating || !newTaskText.trim()}
          className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-3 w-3" />
          <span>Add</span>
        </button>
      </form>
    </div>
  )
}

