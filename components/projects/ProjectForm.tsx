'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save } from 'lucide-react'
import { useCreateQuoteProject, useUpdateQuoteProject } from '@/hooks/useQuoteProjects'
import { useCustomers } from '@/hooks/useCustomers'
import { QuoteProject } from '@/lib/supabase'

const projectSchema = z.object({
  proj_num: z.string().min(1, 'Project number is required'),
  customer_id: z.string().min(1, 'Customer is required'),
  name: z.string().min(1, 'Project name is required'),
  address: z.string().optional(),
  status: z.string().optional(),
  install_commencement_date: z.string().optional(),
  install_duration: z.number().min(0, 'Duration must be positive').optional(),
  budget: z.number().min(0, 'Budget must be positive').optional(),
  priority_level: z.enum(['low', 'medium', 'high']).optional(),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface ProjectFormProps {
  project?: QuoteProject
  onClose: () => void
  onSuccess: () => void
}

export function ProjectForm({ project, onClose, onSuccess }: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createProject = useCreateQuoteProject()
  const updateProject = useUpdateQuoteProject()
  const { data: customers = [] } = useCustomers()
  const isEditing = !!project

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: project ? {
      proj_num: project.proj_num || '',
      customer_id: project.customer_id,
      name: project.name,
      address: project.address || '',
      status: project.status || 'planning',
      install_commencement_date: project.install_commencement_date 
        ? new Date(project.install_commencement_date).toISOString().split('T')[0]
        : '',
      install_duration: project.install_duration || 0,
      budget: project.budget || 0,
      priority_level: project.priority_level || 'medium',
    } : {
      status: 'planning',
      priority_level: 'medium',
      install_duration: 0,
      budget: 0,
    },
  })

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    try {
      if (isEditing && project) {
        await updateProject.mutateAsync({
          id: project.id,
          ...data,
          quote: false,
          address: data.address || null,
          install_commencement_date: data.install_commencement_date || null,
          install_duration: data.install_duration ?? null,
          budget: data.budget ?? 0,
          status: data.status || 'planning',
          priority_level: data.priority_level || null,
        })
      } else {
        await createProject.mutateAsync({
          ...data,
          quote: false,
          address: data.address || null,
          install_commencement_date: data.install_commencement_date || null,
          install_duration: data.install_duration ?? null,
          budget: data.budget ?? 0,
          status: data.status || 'planning',
          priority_level: data.priority_level || null,
          created_by: null,
          description: null,
          quote_num: null,
          quote_date: null,
          valid_until: null,
          total_amount: 0,
          markup_percentage: 0,
        })
      }
      onSuccess()
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} project:`, error)
      alert(`Error ${isEditing ? 'updating' : 'creating'} project. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Number *
              </label>
              <input
                {...register('proj_num')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 2024-001"
              />
              {errors.proj_num && (
                <p className="text-red-500 text-sm mt-1">{errors.proj_num.message}</p>
              )}
            </div>

            {/* Customer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <select
                {...register('customer_id')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company_name}
                  </option>
                ))}
              </select>
              {errors.customer_id && (
                <p className="text-red-500 text-sm mt-1">{errors.customer_id.message}</p>
              )}
            </div>

            {/* Project Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                {...register('name')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Project description"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Project Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Address
              </label>
              <textarea
                {...register('address')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Project site address"
              />
            </div>

            {/* Project Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                {...register('status')}
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
                {...register('budget', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.budget && (
                <p className="text-red-500 text-sm mt-1">{errors.budget.message}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 sm:space-x-3 pt-4 sm:pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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


