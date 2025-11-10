'use client'

import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { useCreateHardware, useUpdateHardware } from '@/hooks/useHardware'
import { useSuppliers } from '@/hooks/useSuppliers'
import { Hardware } from '@/lib/supabase'

interface HardwareFormProps {
  hardware?: Hardware
  onClose: () => void
  onSuccess: () => void
}

export function HardwareForm({ hardware, onClose, onSuccess }: HardwareFormProps) {
  const { data: suppliers } = useSuppliers()
  const [formData, setFormData] = useState({
    name: hardware?.name || '',
    description: hardware?.description || '',
    dimension: hardware?.dimension || '',
    cost_per_unit: hardware?.cost_per_unit || '',
    supplier_id: hardware?.supplier_id || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createHardware = useCreateHardware()
  const updateHardware = useUpdateHardware()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Hardware name is required'
    }
    if (formData.cost_per_unit && parseFloat(formData.cost_per_unit.toString()) < 0) {
      newErrors.cost_per_unit = 'Cost must be 0 or greater'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    try {
      const hardwareData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        dimension: formData.dimension.trim() || null,
        cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit.toString()) : 0,
        supplier_id: formData.supplier_id || null,
        created_by: null, // TODO: Get from auth context when available
      }

      console.log('Creating hardware with data:', hardwareData)

      if (hardware) {
        await updateHardware.mutateAsync({
          id: hardware.id,
          ...hardwareData,
        })
      } else {
        await createHardware.mutateAsync(hardwareData)
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error saving hardware:', error)
      console.error('Error details:', error?.message || error?.error_description || JSON.stringify(error, null, 2))
      const errorMessage = error?.message || error?.error_description || error?.details || 'Failed to save hardware. Please try again.'
      setErrors({ submit: errorMessage })
      alert(`Error saving hardware: ${errorMessage}`)
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
            {hardware ? 'Edit Hardware' : 'Add Hardware'}
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
              Hardware Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Hinge Set, Drawer Slide"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
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

          {/* Dimension */}
          <div>
            <label htmlFor="dimension" className="block text-sm font-medium text-gray-700 mb-1">
              Dimension
            </label>
            <input
              type="text"
              id="dimension"
              value={formData.dimension}
              onChange={(e) => handleChange('dimension', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 100x50x20mm, Standard"
            />
          </div>

          {/* Cost Per Unit */}
          <div>
            <label htmlFor="cost_per_unit" className="block text-sm font-medium text-gray-700 mb-1">
              Cost Per Unit
            </label>
            <input
              type="number"
              id="cost_per_unit"
              step="0.01"
              min="0"
              value={formData.cost_per_unit}
              onChange={(e) => handleChange('cost_per_unit', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.cost_per_unit ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 5.50"
            />
            {errors.cost_per_unit && (
              <p className="text-red-500 text-sm mt-1">{errors.cost_per_unit}</p>
            )}
          </div>

          {/* Supplier */}
          <div>
            <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <select
              id="supplier_id"
              value={formData.supplier_id}
              onChange={(e) => handleChange('supplier_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">No supplier</option>
              {suppliers?.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            {!suppliers && (
              <p className="text-gray-500 text-sm mt-1">Loading suppliers...</p>
            )}
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
              <span>{isSubmitting ? 'Saving...' : (hardware ? 'Update' : 'Add')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

