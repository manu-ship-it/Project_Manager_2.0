'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Save } from 'lucide-react'
import { useCreateJoineryItem, useUpdateJoineryItem } from '@/hooks/useJoineryItems'
import { JoineryItem } from '@/lib/supabase'

const joineryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  install_commencement_date: z.string().optional(),
  install_duration: z.number().min(0, 'Duration must be positive').optional(),
  budget: z.number().min(0, 'Budget must be positive').optional(),
})

type JoineryItemFormData = z.infer<typeof joineryItemSchema>

interface JoineryItemFormProps {
  projectId: string
  onClose: () => void
  onSuccess: () => void
  item?: JoineryItem // Optional: if provided, we're in edit mode
}

export function JoineryItemForm({ projectId, onClose, onSuccess, item }: JoineryItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createJoineryItem = useCreateJoineryItem()
  const updateJoineryItem = useUpdateJoineryItem()
  const isEditMode = !!item

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<JoineryItemFormData>({
    resolver: zodResolver(joineryItemSchema),
    defaultValues: {
      install_duration: 0,
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (item) {
      // Format date for HTML date input (YYYY-MM-DD)
      let formattedDate = undefined
      if (item.install_commencement_date) {
        const date = new Date(item.install_commencement_date)
        formattedDate = date.toISOString().split('T')[0]
      }
      
      reset({
        name: item.name,
        install_commencement_date: formattedDate,
        install_duration: item.install_duration || 0,
        budget: item.budget || 0,
      })
    }
  }, [item, reset])

  const onSubmit = async (data: JoineryItemFormData) => {
    setIsSubmitting(true)
    try {
      if (isEditMode && item) {
        // Update existing item
        await updateJoineryItem.mutateAsync({
          id: item.id,
          name: data.name,
          install_commencement_date: data.install_commencement_date || null,
          install_duration: data.install_duration ?? undefined,
          budget: data.budget ?? undefined,
        })
      } else {
        // Create new item
        await createJoineryItem.mutateAsync({
          name: data.name,
          quote_proj_id: projectId,
          quote: false, // This is a project joinery item
          qty: 1,
          created_by: null,
          joinery_number: null,
          description: null,
          factory_hours: null,
          install_hours: null,
          install_commencement_date: data.install_commencement_date || null,
          install_duration: data.install_duration ?? null,
          budget: data.budget ?? 0,
          carcass_material_id: null,
          face_material_1_id: null,
          face_material_2_id: null,
          face_material_3_id: null,
          face_material_4_id: null,
          hinge_id: null,
          drawer_hardware_id: null,
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
      }
      onSuccess()
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} joinery item:`, error)
      console.error('Error details:', error?.message || error?.error_description || JSON.stringify(error, null, 2))
      alert(`Error ${isEditMode ? 'updating' : 'creating'} joinery item: ${error?.message || error?.error_description || 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Joinery Item' : 'Add Joinery Item'}
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
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name *
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Kitchen Cabinets, Island Unit"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget ($)
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
              <span>{isSubmitting ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Item' : 'Add Item')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


