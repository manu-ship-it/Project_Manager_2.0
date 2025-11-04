'use client'

import { useState } from 'react'
import { Calendar, DollarSign, User, MapPin, Clock, MoreVertical, Edit, Trash2, Eye } from 'lucide-react'
import { Project } from '@/lib/supabase'
import { useDeleteProject } from '@/hooks/useProjects'
import { format } from 'date-fns'

interface ProjectCardProps {
  project: Project
  daysUntilInstall: number | null
  urgencyColor: string
  onEdit?: (project: Project) => void
  onUpdate?: (id: string, updates: Partial<Project>) => Promise<void>
}

export function ProjectCard({ project, daysUntilInstall, urgencyColor, onEdit, onUpdate }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const deleteProject = useDeleteProject()

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await deleteProject.mutateAsync(project.id)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'on_hold': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md hover:bg-blue-50 transition-all duration-150">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{project.project_name}</h3>
              {onUpdate ? (
                <select
                  value={project.project_status}
                  onChange={async (e) => {
                    e.stopPropagation()
                    setIsUpdating(true)
                    try {
                      await onUpdate(project.id, { project_status: e.target.value as Project['project_status'] })
                    } finally {
                      setIsUpdating(false)
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  disabled={isUpdating}
                  className={`px-2 py-1 text-xs font-medium rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${getStatusColor(project.project_status)}`}
                >
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
              ) : (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.project_status)}`}>
                  {project.project_status.replace('_', ' ')}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">#{project.project_number}</p>
            <p className="text-sm text-gray-500">{project.client}</p>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showMenu && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    if (onEdit) {
                      onEdit(project)
                      setShowMenu(false)
                    }
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Project</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete()
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Project</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-3">
          {/* Project Address */}
          {project.project_address && (
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <span className="text-sm text-gray-600">{project.project_address}</span>
            </div>
          )}

          {/* Budget */}
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Budget: ${project.overall_project_budget.toLocaleString()}
            </span>
          </div>

          {/* Install Date & Duration */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            {onUpdate ? (
              <input
                type="date"
                value={project.install_commencement_date ? new Date(project.install_commencement_date).toISOString().split('T')[0] : ''}
                onChange={async (e) => {
                  e.stopPropagation()
                  setIsUpdating(true)
                  try {
                    await onUpdate(project.id, { install_commencement_date: e.target.value || '' })
                  } finally {
                    setIsUpdating(false)
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                disabled={isUpdating}
                className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                placeholder="Select install date"
              />
            ) : project.install_commencement_date ? (
              <span className="text-sm text-gray-600">
                Install: {format(new Date(project.install_commencement_date), 'MMM dd, yyyy')}
              </span>
            ) : (
              <span className="text-sm text-gray-400">No install date set</span>
            )}
          </div>

          {project.install_duration > 0 && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Duration: {project.install_duration} days
              </span>
            </div>
          )}

          {/* Priority */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Priority:</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority_level)}`}>
              {project.priority_level}
            </span>
          </div>
        </div>

        {/* Days Until Install */}
        {daysUntilInstall !== null && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Days until install:</span>
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${urgencyColor}`}>
                {daysUntilInstall > 0 ? `${daysUntilInstall} days` : 'Overdue'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


