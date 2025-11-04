'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save } from 'lucide-react'
import { useCreateJoineryItem } from '@/hooks/useJoineryItems'

const joineryItemSchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  item_budget: z.number().min(0, 'Budget must be positive'),
  install_commencement_date: z.string().optional(),
  install_duration: z.number().min(0, 'Duration must be positive'),
})

type JoineryItemFormData = z.infer<typeof joineryItemSchema>

interface JoineryItemFormProps {
  projectId: string
  onClose: () => void
  onSuccess: () => void
}

export function JoineryItemForm({ projectId, onClose, onSuccess }: JoineryItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createJoineryItem = useCreateJoineryItem()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoineryItemFormData>({
    resolver: zodResolver(joineryItemSchema),
    defaultValues: {
      item_budget: 0,
      install_duration: 0,
    },
  })

  const onSubmit = async (data: JoineryItemFormData) => {
    setIsSubmitting(true)
    try {
      await createJoineryItem.mutateAsync({
        ...data,
        project_id: projectId,
        install_commencement_date: data.install_commencement_date || '',
        shop_drawings_approved: false,
        board_ordered: false,
        hardware_ordered: false,
        site_measured: false,
        microvellum_ready_to_process: false,
        processed_to_factory: false,
        picked_up_from_factory: false,
        install_scheduled: false,
        plans_printed: false,
        assembled: false,
        delivered: false,
        installed: false,
        invoiced: false,
      })
      onSuccess()
    } catch (error) {
      console.error('Error creating joinery item:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add Joinery Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name *
            </label>
            <input
              {...register('item_name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Kitchen Cabinets, Island Unit"
            />
            {errors.item_name && (
              <p className="text-red-500 text-sm mt-1">{errors.item_name.message}</p>
            )}
          </div>

          {/* Item Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Budget ($) *
            </label>
            <input
              {...register('item_budget', { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.item_budget && (
              <p className="text-red-500 text-sm mt-1">{errors.item_budget.message}</p>
            )}
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
              <span>{isSubmitting ? 'Adding...' : 'Add Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


