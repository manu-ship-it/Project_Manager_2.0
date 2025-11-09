'use client'

import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { useCreateTemplateCabinet, useUpdateTemplateCabinet } from '@/hooks/useTemplateCabinets'
import { TemplateCabinet, CabinetType } from '@/lib/supabase'

interface StandardCabinetFormProps {
  cabinet?: TemplateCabinet
  onClose: () => void
  onSuccess: () => void
}

const cabinetCategories: string[] = ['base', 'wall', 'tall', 'commercial', 'accessories']
const cabinetTypes: CabinetType[] = [
  'door',
  'drawer',
  'open',
  'int_dishwasher',
  'accessories',
  'int_rangehood',
  'int_fridge',
]

export function StandardCabinetForm({ cabinet, onClose, onSuccess }: StandardCabinetFormProps) {
  const [formData, setFormData] = useState({
    category: cabinet?.category || 'base',
    type: cabinet?.type || 'door',
    width: cabinet?.width || '',
    height: cabinet?.height || '',
    depth: cabinet?.depth || '',
    name: cabinet?.name || '',
    description: cabinet?.description || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createCabinet = useCreateTemplateCabinet()
  const updateCabinet = useUpdateTemplateCabinet()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.width || parseFloat(formData.width.toString()) <= 0) {
      newErrors.width = 'Width must be greater than 0'
    }
    if (!formData.height || parseFloat(formData.height.toString()) <= 0) {
      newErrors.height = 'Height must be greater than 0'
    }
    if (!formData.depth || parseFloat(formData.depth.toString()) <= 0) {
      newErrors.depth = 'Depth must be greater than 0'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    try {
      const cabinetData = {
        category: formData.category || null,
        type: formData.type || null,
        width: formData.width ? parseFloat(formData.width.toString()) : null,
        height: formData.height ? parseFloat(formData.height.toString()) : null,
        depth: formData.depth ? parseFloat(formData.depth.toString()) : null,
        name: formData.name.trim() || null,
        description: formData.description.trim() || null,
        assigned_face_material: 1 as const,
        end_panels_qty: 0,
        hinge_qty: null,
        drawer_qty: 0,
        door_qty: 0,
        shelf_qty: 0,
        drawer_hardware_qty: null,
        carcass_calculation: null,
        face_calculation: null,
      }

      console.log('Creating cabinet with data:', cabinetData)

      if (cabinet) {
        await updateCabinet.mutateAsync({
          id: cabinet.id,
          ...cabinetData,
        })
      } else {
        await createCabinet.mutateAsync(cabinetData)
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error saving cabinet:', error)
      console.error('Error details:', error?.message || error?.error_description || JSON.stringify(error, null, 2))
      const errorMessage = error?.message || error?.error_description || error?.details || 'Failed to save cabinet. Please try again.'
      setErrors({ submit: errorMessage })
      alert(`Error saving cabinet: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {cabinet ? 'Edit Standard Cabinet' : 'Add Standard Cabinet'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Cabinet Name (Optional)
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Standard Base Cabinet 600mm"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {cabinetCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {cabinetTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-1">
                Width (mm) *
              </label>
              <input
                type="number"
                id="width"
                step="0.01"
                min="0.01"
                value={formData.width}
                onChange={(e) => handleChange('width', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.width ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="600"
                required
              />
              {errors.width && (
                <p className="text-red-500 text-xs mt-1">{errors.width}</p>
              )}
            </div>

            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                Height (mm) *
              </label>
              <input
                type="number"
                id="height"
                step="0.01"
                min="0.01"
                value={formData.height}
                onChange={(e) => handleChange('height', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.height ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="600"
                required
              />
              {errors.height && (
                <p className="text-red-500 text-xs mt-1">{errors.height}</p>
              )}
            </div>

            <div>
              <label htmlFor="depth" className="block text-sm font-medium text-gray-700 mb-1">
                Depth (mm) *
              </label>
              <input
                type="number"
                id="depth"
                step="0.01"
                min="0.01"
                value={formData.depth}
                onChange={(e) => handleChange('depth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.depth ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="600"
                required
              />
              {errors.depth && (
                <p className="text-red-500 text-xs mt-1">{errors.depth}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional description..."
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <p className="text-red-500 text-sm">{errors.submit}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
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
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : (cabinet ? 'Update' : 'Add')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

