'use client'

import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { useCreateMaterial, useUpdateMaterial } from '@/hooks/useMaterials'
import { Material } from '@/lib/supabase'

interface MaterialFormProps {
  projectId: string
  material?: Material
  onClose: () => void
  onSuccess: () => void
}

export function MaterialForm({ projectId, material, onClose, onSuccess }: MaterialFormProps) {
  const [formData, setFormData] = useState({
    material_name: material?.material_name || '',
    thickness: material?.thickness || '',
    board_size: material?.board_size || '',
    quantity: material?.quantity || 0,
    supplier: material?.supplier || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createMaterial = useCreateMaterial()
  const updateMaterial = useUpdateMaterial()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.material_name.trim()) {
      newErrors.material_name = 'Material name is required'
    }
    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity must be 0 or greater'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    try {
      const materialData = {
        project_id: projectId,
        material_name: formData.material_name.trim(),
        thickness: formData.thickness ? parseFloat(formData.thickness.toString()) : null,
        board_size: formData.board_size.trim() || null,
        quantity: formData.quantity,
        supplier: formData.supplier.trim() || null,
      }

      if (material) {
        await updateMaterial.mutateAsync({
          id: material.id,
          ...materialData,
        })
      } else {
        await createMaterial.mutateAsync(materialData)
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving material:', error)
      setErrors({ submit: 'Failed to save material. Please try again.' })
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
            {material ? 'Edit Material' : 'Add Material'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Material Name */}
          <div>
            <label htmlFor="material_name" className="block text-sm font-medium text-gray-700 mb-1">
              Material Name *
            </label>
            <input
              type="text"
              id="material_name"
              value={formData.material_name}
              onChange={(e) => handleChange('material_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.material_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Oak Veneer, Hardware Set"
            />
            {errors.material_name && (
              <p className="text-red-500 text-sm mt-1">{errors.material_name}</p>
            )}
          </div>

          {/* Thickness */}
          <div>
            <label htmlFor="thickness" className="block text-sm font-medium text-gray-700 mb-1">
              Thickness (mm)
            </label>
            <input
              type="number"
              id="thickness"
              step="0.1"
              value={formData.thickness}
              onChange={(e) => handleChange('thickness', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 18.0"
            />
          </div>

          {/* Board Size */}
          <div>
            <label htmlFor="board_size" className="block text-sm font-medium text-gray-700 mb-1">
              Board Size
            </label>
            <input
              type="text"
              id="board_size"
              value={formData.board_size}
              onChange={(e) => handleChange('board_size', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 2400x1200"
            />
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              id="quantity"
              min="0"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.quantity ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* Supplier */}
          <div>
            <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <input
              type="text"
              id="supplier"
              value={formData.supplier}
              onChange={(e) => handleChange('supplier', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Timber Supplies"
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
              <span>{isSubmitting ? 'Saving...' : (material ? 'Update' : 'Add')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}