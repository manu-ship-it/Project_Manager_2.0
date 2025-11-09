'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { useCreateMaterial, useUpdateMaterial } from '@/hooks/useMaterials'
import { useSuppliers } from '@/hooks/useSuppliers'
import { Material } from '@/lib/supabase'

interface MaterialFormProps {
  projectId?: string // Optional now, kept for backward compatibility
  material?: Material
  onClose: () => void
  onSuccess: () => void
}

export function MaterialForm({ projectId, material, onClose, onSuccess }: MaterialFormProps) {
  const { data: suppliers } = useSuppliers()
  const [formData, setFormData] = useState({
    name: material?.name || '',
    material_type: material?.material_type || '',
    thickness: material?.thickness || '',
    length: material?.length || '',
    width: material?.width || '',
    edge_size: material?.edge_size || '',
    supplier_id: material?.supplier_id || '',
    cost_per_unit: material?.cost_per_unit || '',
    unit: material?.unit || 'units',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createMaterial = useCreateMaterial()
  const updateMaterial = useUpdateMaterial()

  // Reset form when material_type changes
  useEffect(() => {
    if (formData.material_type === 'Board/Laminate') {
      // Clear Edgetape fields
      setFormData(prev => ({ ...prev, edge_size: '' }))
    } else if (formData.material_type === 'Edgetape') {
      // Clear Board/Laminate fields
      setFormData(prev => ({ ...prev, length: '', width: '' }))
    }
  }, [formData.material_type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Material name is required'
    }

    if (formData.material_type === 'Board/Laminate') {
      if (!formData.length || parseFloat(formData.length.toString()) <= 0) {
        newErrors.length = 'Length is required for Board/Laminate'
      }
      if (!formData.width || parseFloat(formData.width.toString()) <= 0) {
        newErrors.width = 'Width is required for Board/Laminate'
      }
    } else if (formData.material_type === 'Edgetape') {
      if (!formData.edge_size) {
        newErrors.edge_size = 'Edge size is required for Edgetape'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    try {
      const materialData: any = {
        name: formData.name.trim(),
        material_type: formData.material_type || null,
        thickness: formData.thickness ? parseFloat(formData.thickness.toString()) : null,
        supplier_id: formData.supplier_id || null,
        cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit.toString()) : null,
        unit: formData.unit || null,
      }

      // Set fields based on material type
      if (formData.material_type === 'Board/Laminate') {
        materialData.length = formData.length ? parseFloat(formData.length.toString()) : null
        materialData.width = formData.width ? parseFloat(formData.width.toString()) : null
        materialData.edge_size = null
      } else if (formData.material_type === 'Edgetape') {
        materialData.edge_size = formData.edge_size || null
        materialData.length = null
        materialData.width = null
      } else {
        // If no material type selected, set all to null
        materialData.length = null
        materialData.width = null
        materialData.edge_size = null
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

  const edgeSizeOptions: Array<'21x1' | '21x2' | '29x1' | '29x2' | '38x1' | '38x2'> = [
    '21x1', '21x2', '29x1', '29x2', '38x1', '38x2'
  ]

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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Material Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Oak Veneer, Hardware Set"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Material Type */}
          <div>
            <label htmlFor="material_type" className="block text-sm font-medium text-gray-700 mb-1">
              Material Type
            </label>
            <select
              id="material_type"
              value={formData.material_type}
              onChange={(e) => handleChange('material_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select type...</option>
              <option value="Board/Laminate">Board/Laminate</option>
              <option value="Edgetape">Edgetape</option>
            </select>
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

          {/* Board/Laminate Fields: Length and Width */}
          {formData.material_type === 'Board/Laminate' && (
            <>
              <div>
                <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-1">
                  Length (mm) *
                </label>
                <input
                  type="number"
                  id="length"
                  step="0.01"
                  min="0"
                  value={formData.length}
                  onChange={(e) => handleChange('length', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.length ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 2400"
                />
                {errors.length && (
                  <p className="text-red-500 text-sm mt-1">{errors.length}</p>
                )}
              </div>

              <div>
                <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-1">
                  Width (mm) *
                </label>
                <input
                  type="number"
                  id="width"
                  step="0.01"
                  min="0"
                  value={formData.width}
                  onChange={(e) => handleChange('width', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.width ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 1200"
                />
                {errors.width && (
                  <p className="text-red-500 text-sm mt-1">{errors.width}</p>
                )}
              </div>
            </>
          )}

          {/* Edgetape Field: Edge Size */}
          {formData.material_type === 'Edgetape' && (
            <div>
              <label htmlFor="edge_size" className="block text-sm font-medium text-gray-700 mb-1">
                Edge Size *
              </label>
              <select
                id="edge_size"
                value={formData.edge_size}
                onChange={(e) => handleChange('edge_size', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.edge_size ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select edge size...</option>
                {edgeSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              {errors.edge_size && (
                <p className="text-red-500 text-sm mt-1">{errors.edge_size}</p>
              )}
            </div>
          )}

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 10.50"
            />
          </div>

          {/* Unit */}
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <select
              id="unit"
              value={formData.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="sheet">Sheet</option>
              <option value="meters">Meters</option>
              <option value="units">Units</option>
              <option value="hours">Hours</option>
            </select>
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
