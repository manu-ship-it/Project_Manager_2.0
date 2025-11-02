'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save } from 'lucide-react'
import { useCreateProject, useUpdateProject } from '@/hooks/useProjects'
import { Project } from '@/lib/supabase'

const projectSchema = z.object({
  project_number: z.string().min(1, 'Project number is required'),
  client: z.string().min(1, 'Client name is required'),
  project_name: z.string().min(1, 'Project name is required'),
  project_address: z.string().optional(),
  project_status: z.enum(['planning', 'in_progress', 'completed', 'on_hold']),
  install_commencement_date: z.string().optional(),
  install_duration: z.number().min(0, 'Duration must be positive'),
  overall_project_budget: z.number().min(0, 'Budget must be positive'),
  priority_level: z.enum(['low', 'medium', 'high']),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface ProjectFormProps {
  project?: Project
  onClose: () => void
  onSuccess: () => void
}

export function ProjectForm({ project, onClose, onSuccess }: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const isEditing = !!project

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: project ? {
      project_number: project.project_number,
      client: project.client,
      project_name: project.project_name,
      project_address: project.project_address || '',
      project_status: project.project_status,
      install_commencement_date: project.install_commencement_date 
        ? new Date(project.install_commencement_date).toISOString().split('T')[0]
        : '',
      install_duration: project.install_duration,
      overall_project_budget: project.overall_project_budget,
      priority_level: project.priority_level,
    } : {
      project_status: 'planning',
      priority_level: 'medium',
      install_duration: 0,
      overall_project_budget: 0,
    },
  })

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    try {
      if (isEditing && project) {
        await updateProject.mutateAsync({
          id: project.id,
          ...data,
          project_address: data.project_address || '',
          install_commencement_date: data.install_commencement_date || '',
        })
      } else {
        await createProject.mutateAsync({
          ...data,
          project_address: data.project_address || '',
          install_commencement_date: data.install_commencement_date || '',
          date_created: new Date().toISOString(),
        })
      }
      onSuccess()
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} project:`, error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Number *
              </label>
              <input
                {...register('project_number')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 2024-001"
              />
              {errors.project_number && (
                <p className="text-red-500 text-sm mt-1">{errors.project_number.message}</p>
              )}
            </div>

            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client *
              </label>
              <input
                {...register('client')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Client name"
              />
              {errors.client && (
                <p className="text-red-500 text-sm mt-1">{errors.client.message}</p>
              )}
            </div>

            {/* Project Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                {...register('project_name')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Project description"
              />
              {errors.project_name && (
                <p className="text-red-500 text-sm mt-1">{errors.project_name.message}</p>
              )}
            </div>

            {/* Project Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Address
              </label>
              <textarea
                {...register('project_address')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Project site address"
              />
            </div>

            {/* Project Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                {...register('project_status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>

            {/* Priority Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level *
              </label>
              <select
                {...register('priority_level')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Install Commencement Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Install Commencement Date
              </label>
              <input
                {...register('install_commencement_date')}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Install Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Install Duration (days)
              </label>
              <input
                {...register('install_duration', { valueAsNumber: true })}
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.install_duration && (
                <p className="text-red-500 text-sm mt-1">{errors.install_duration.message}</p>
              )}
            </div>

            {/* Overall Project Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall Project Budget ($)
              </label>
              <input
                {...register('overall_project_budget', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.overall_project_budget && (
                <p className="text-red-500 text-sm mt-1">{errors.overall_project_budget.message}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>
                {isSubmitting 
                  ? (isEditing ? 'Updating...' : 'Creating...') 
                  : (isEditing ? 'Update Project' : 'Create Project')
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


