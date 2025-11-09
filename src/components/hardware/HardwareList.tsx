'use client'

import { useState } from 'react'
import { Plus, Edit, Save, Trash2, X } from 'lucide-react'
import { useHardware, useCreateHardware, useUpdateHardware, useDeleteHardware } from '@/hooks/useHardware'
import { useSuppliers } from '@/hooks/useSuppliers'
import { Hardware } from '@/lib/supabase'

export function HardwareList() {
  const [selectedHardware, setSelectedHardware] = useState<Hardware | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { data: hardware, isLoading } = useHardware()
  const { data: suppliers } = useSuppliers()
  const createHardware = useCreateHardware()
  const updateHardware = useUpdateHardware()
  const deleteHardware = useDeleteHardware()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dimension: '',
    cost_per_unit: '',
    supplier_id: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSelectHardware = (item: Hardware) => {
    setSelectedHardware(item)
    setIsEditing(false)
    setIsCreating(false)
    setFormData({
      name: item.name || '',
      description: item.description || '',
      dimension: item.dimension || '',
      cost_per_unit: item.cost_per_unit?.toString() || '',
      supplier_id: item.supplier_id || '',
    })
  }

  const handleEdit = () => {
    if (selectedHardware) {
      setIsEditing(true)
    }
  }

  const handleCancel = () => {
    if (selectedHardware) {
      setIsEditing(false)
      setFormData({
        name: selectedHardware.name || '',
        description: selectedHardware.description || '',
        dimension: selectedHardware.dimension || '',
        cost_per_unit: selectedHardware.cost_per_unit?.toString() || '',
        supplier_id: selectedHardware.supplier_id || '',
      })
    }
    setErrors({})
  }

  const handleCreateNew = () => {
    setIsCreating(true)
    setIsEditing(false)
    setSelectedHardware(null)
    setFormData({
      name: '',
      description: '',
      dimension: '',
      cost_per_unit: '',
      supplier_id: '',
    })
    setErrors({})
  }

  const handleSave = async () => {
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
        created_by: null,
      }

      if (isCreating) {
        const newHardware = await createHardware.mutateAsync(hardwareData)
        setSelectedHardware(newHardware)
        setIsCreating(false)
        setIsEditing(false)
      } else if (selectedHardware) {
        const updatedHardware = await updateHardware.mutateAsync({
          id: selectedHardware.id,
          ...hardwareData,
        })
        setIsEditing(false)
        setSelectedHardware(updatedHardware)
      }
    } catch (error: any) {
      console.error('Error saving hardware:', error)
      const errorMessage = error?.message || error?.error_description || error?.details || 'Failed to save hardware. Please try again.'
      setErrors({ submit: errorMessage })
      alert(`Error saving hardware: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (item: Hardware) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        await deleteHardware.mutateAsync(item.id)
        if (selectedHardware?.id === item.id) {
          setSelectedHardware(null)
          setIsEditing(false)
        }
      } catch (error: any) {
        console.error('Error deleting hardware:', error)
        const errorMessage = error?.message || error?.error_description || error?.details || 'Failed to delete hardware. Please try again.'
        alert(`Error deleting hardware: ${errorMessage}`)
      }
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

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
          <h3 className="text-lg font-semibold text-gray-900">Hardware Library</h3>
          <p className="text-sm text-gray-600">Manage global hardware catalog (available to all projects)</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Hardware</span>
        </button>
      </div>

      {/* Side Panel Layout */}
      <div className="flex gap-6 h-[calc(100vh-300px)]">
        {/* Left Panel - List of Names */}
        <div className="w-1/3 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-semibold text-gray-900">Hardware ({hardware?.length || 0})</h4>
          </div>
          <div className="flex-1 overflow-y-auto">
            {hardware && hardware.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {hardware.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectHardware(item)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      selectedHardware?.id === item.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {item.name}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {item.dimension || 'No dimension'} • {item.cost_per_unit > 0 ? `$${item.cost_per_unit.toFixed(2)}/unit` : 'No cost'}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No hardware found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Details */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-y-auto">
          {isCreating || selectedHardware ? (
            <div className="p-6">
              {/* Header with Edit/Save buttons */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <h4 className="text-lg font-semibold text-gray-900">
                  {isCreating ? 'New Hardware' : selectedHardware?.name}
                </h4>
                <div className="flex items-center space-x-2">
                  {!isCreating && !isEditing && (
                    <>
                      <button
                        onClick={handleEdit}
                        className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => selectedHardware && handleDelete(selectedHardware)}
                        className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                  {(isEditing || isCreating) && (
                    <>
                      <button
                        onClick={isCreating ? () => setIsCreating(false) : handleCancel}
                        className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="h-4 w-4" />
                        <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Hardware Name *
                  </label>
                  {isEditing || isCreating ? (
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
                  ) : (
                    <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg">
                      {selectedHardware?.name || '-'}
                    </div>
                  )}
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  {isEditing || isCreating ? (
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Optional description..."
                    />
                  ) : (
                    <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg min-h-[60px]">
                      {selectedHardware?.description || '-'}
                    </div>
                  )}
                </div>

                {/* Dimension */}
                <div>
                  <label htmlFor="dimension" className="block text-sm font-medium text-gray-700 mb-1">
                    Dimension
                  </label>
                  {isEditing || isCreating ? (
                    <input
                      type="text"
                      id="dimension"
                      value={formData.dimension}
                      onChange={(e) => handleChange('dimension', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 100x50x20mm, Standard"
                    />
                  ) : (
                    <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg">
                      {selectedHardware?.dimension || '-'}
                    </div>
                  )}
                </div>

                {/* Cost Per Unit */}
                <div>
                  <label htmlFor="cost_per_unit" className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Per Unit
                  </label>
                  {isEditing || isCreating ? (
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
                  ) : (
                    <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg">
                      {selectedHardware?.cost_per_unit !== null && selectedHardware?.cost_per_unit !== undefined && selectedHardware.cost_per_unit > 0
                        ? `$${selectedHardware.cost_per_unit.toFixed(2)}/unit`
                        : '-'}
                    </div>
                  )}
                  {errors.cost_per_unit && (
                    <p className="text-red-500 text-sm mt-1">{errors.cost_per_unit}</p>
                  )}
                </div>

                {/* Supplier */}
                <div>
                  <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  {isEditing || isCreating ? (
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
                  ) : (
                    <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg">
                      {selectedHardware?.supplier?.name || '-'}
                    </div>
                  )}
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{errors.submit}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <p>Select a hardware item from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
