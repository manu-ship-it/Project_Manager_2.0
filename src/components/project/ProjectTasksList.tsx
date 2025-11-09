'use client'

import { useState } from 'react'
import { Plus, Check, X, Trash2, Flag } from 'lucide-react'
import { useProjectTasks, useUpdateProjectTask, useDeleteProjectTask } from '@/hooks/useProjectTasks'
import { ProjectTaskForm } from './ProjectTaskForm'
import { supabase, ProjectTask } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { useProjects } from '@/hooks/useProjects'

interface ProjectTasksListProps {
  projectId: string
}

export function ProjectTasksList({ projectId }: ProjectTasksListProps) {
  const [showForm, setShowForm] = useState(false)
  const { data: tasks, isLoading } = useProjectTasks(projectId)
  const { data: projects } = useProjects()
  
  // Fetch all tasks across all non-completed projects to check flag limit
  const nonCompletedProjects = projects?.filter(p => p.status !== 'completed') || []
  const projectIds = nonCompletedProjects.map(p => p.id)
  
  const { data: allTasks } = useQuery({
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
  
  // Count flagged tasks across all projects
  const flaggedCount = allTasks?.filter(t => t.is_flagged).length || 0
  const canFlagMore = flaggedCount < 3

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Project Tasks</h3>
          <p className="text-sm text-gray-600">Manage project-level tasks and track completion</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Tasks List */}
      {tasks && tasks.length > 0 ? (
        <div className="space-y-3">
          {[...tasks]
            .sort((a, b) => {
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
            .map((task) => (
              <TaskItem 
                key={task.id} 
                task={task} 
                canFlagMore={canFlagMore}
                allTasks={allTasks || []}
              />
            ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
          <p className="text-gray-500 mb-4">Add your first task to get started.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add First Task</span>
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ProjectTaskForm
          projectId={projectId}
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

function TaskItem({ 
  task, 
  canFlagMore, 
  allTasks 
}: { 
  task: ProjectTask
  canFlagMore: boolean
  allTasks: ProjectTask[]
}) {
  const [isUpdating, setIsUpdating] = useState(false)
  const updateTask = useUpdateProjectTask()
  const deleteTask = useDeleteProjectTask()

  const handleToggleComplete = async () => {
    setIsUpdating(true)
    try {
      await updateTask.mutateAsync({
        id: task.id,
        is_completed: !task.is_completed,
      })
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleFlag = async () => {
    // If trying to flag (not unflag), check the limit
    if (!task.is_flagged) {
      const flaggedCount = allTasks.filter(t => t.is_flagged).length
      if (flaggedCount >= 3) {
        alert('Maximum of 3 tasks can be flagged at once. Please unflag a task first.')
        return
      }
    }

    setIsUpdating(true)
    try {
      await updateTask.mutateAsync({
        id: task.id,
        is_flagged: !task.is_flagged,
      })
    } catch (error) {
      console.error('Error updating task flag:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask.mutateAsync(task.id)
    }
  }

  return (
    <div className={`bg-white border rounded-lg p-4 ${
      task.is_completed ? 'opacity-75' : ''
    } ${
      task.is_flagged ? 'bg-red-50 border-l-4 border-red-500' : ''
    }`}>
      <div className="flex items-center space-x-3">
        <button
          onClick={handleToggleComplete}
          disabled={isUpdating}
          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
            task.is_completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-green-500'
          }`}
        >
          {task.is_completed && <Check className="h-4 w-4" />}
        </button>
        
        <div className="flex-1">
          <p className={`text-sm ${
            task.is_completed 
              ? 'text-gray-500 line-through' 
              : task.is_flagged
              ? 'text-red-900 font-medium'
              : 'text-gray-900'
          }`}>
            {task.task_description}
          </p>
        </div>

        <button
          onClick={handleToggleFlag}
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
          <Flag className={`h-4 w-4 ${task.is_flagged ? 'fill-current' : ''}`} />
        </button>

        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
