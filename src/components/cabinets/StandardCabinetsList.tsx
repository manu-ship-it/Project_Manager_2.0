'use client'

import { useState } from 'react'
import { Plus, Edit, Save, Trash2, X, Filter } from 'lucide-react'
import { useTemplateCabinets, useCreateTemplateCabinet, useUpdateTemplateCabinet, useDeleteTemplateCabinet } from '@/hooks/useTemplateCabinets'
import { TemplateCabinet, CabinetType } from '@/lib/supabase'

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

export function StandardCabinetsList() {
  const [selectedCabinet, setSelectedCabinet] = useState<TemplateCabinet | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all')
  const { data: cabinets, isLoading } = useTemplateCabinets()
  const createCabinet = useCreateTemplateCabinet()
  const updateCabinet = useUpdateTemplateCabinet()
  const deleteCabinet = useDeleteTemplateCabinet()

  const [formData, setFormData] = useState({
    category: 'base',
    type: 'door' as CabinetType,
    width: '',
    height: '',
    depth: '',
    name: '',
    description: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter cabinets by category
  const filteredCabinets = cabinets?.filter(cabinet => 
    categoryFilter === 'all' || cabinet.category === categoryFilter
  ) || []

  const handleSelectCabinet = (cabinet: TemplateCabinet) => {
    setSelectedCabinet(cabinet)
    setIsEditing(false)
    setIsCreating(false)
    setFormData({
      category: cabinet.category || 'base',
      type: cabinet.type || 'door',
      width: cabinet.width?.toString() || '',
      height: cabinet.height?.toString() || '',
      depth: cabinet.depth?.toString() || '',
      name: cabinet.name || '',
      description: cabinet.description || '',
    })
  }

  const handleEdit = () => {
    if (selectedCabinet) {
      setIsEditing(true)
    }
  }

  const handleCancel = () => {
    if (selectedCabinet) {
      setIsEditing(false)
      setFormData({
        category: selectedCabinet.category || 'base',
        type: selectedCabinet.type || 'door',
        width: selectedCabinet.width?.toString() || '',
        height: selectedCabinet.height?.toString() || '',
        depth: selectedCabinet.depth?.toString() || '',
        name: selectedCabinet.name || '',
        description: selectedCabinet.description || '',
      })
    }
    setErrors({})
  }

  const handleCreateNew = () => {
    setIsCreating(true)
    setIsEditing(false)
    setSelectedCabinet(null)
    setFormData({
      category: 'base',
      type: 'door',
      width: '',
      height: '',
      depth: '',
      name: '',
      description: '',
    })
    setErrors({})
  }

  const handleSave = async () => {
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

      if (isCreating) {
        const newCabinet = await createCabinet.mutateAsync(cabinetData)
        setSelectedCabinet(newCabinet)
        setIsCreating(false)
        setIsEditing(false)
      } else if (selectedCabinet) {
        const updatedCabinet = await updateCabinet.mutateAsync({
          id: selectedCabinet.id,
          ...cabinetData,
        })
        setIsEditing(false)
        setSelectedCabinet(updatedCabinet)
      }
    } catch (error: any) {
      console.error('Error saving cabinet:', error)
      const errorMessage = error?.message || error?.error_description || error?.details || 'Failed to save cabinet. Please try again.'
      setErrors({ submit: errorMessage })
      alert(`Error saving cabinet: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (cabinet: TemplateCabinet) => {
    if (confirm(`Are you sure you want to delete "${cabinet.name || `${cabinet.category} - ${cabinet.type}`}"?`)) {
      try {
        await deleteCabinet.mutateAsync(cabinet.id)
        if (selectedCabinet?.id === cabinet.id) {
          setSelectedCabinet(null)
          setIsEditing(false)
        }
      } catch (error: any) {
        console.error('Error deleting cabinet:', error)
        const errorMessage = error?.message || error?.error_description || error?.details || 'Failed to delete cabinet. Please try again.'
        alert(`Error deleting cabinet: ${errorMessage}`)
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
          <h3 className="text-lg font-semibold text-gray-900">Standard Cabinets Library</h3>
          <p className="text-sm text-gray-600">Manage global standard cabinet catalog (available to all projects)</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Cabinet</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center space-x-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">Filter by category:</span>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as any)}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Categories</option>
          {cabinetCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Side Panel Layout */}
      <div className="flex gap-6 h-[calc(100vh-300px)]">
        {/* Left Panel - List of Names */}
        <div className="w-1/3 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-semibold text-gray-900">Cabinets ({filteredCabinets.length})</h4>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredCabinets.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredCabinets.map((cabinet) => (
                  <button
                    key={cabinet.id}
                    onClick={() => handleSelectCabinet(cabinet)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      selectedCabinet?.id === cabinet.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {cabinet.name || `${cabinet.category || ''} - ${cabinet.type || ''}`.trim() || 'Unnamed Cabinet'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {cabinet.width && cabinet.height && cabinet.depth
                        ? `${cabinet.width}mm × ${cabinet.height}mm × ${cabinet.depth}mm`
                        : cabinet.width && cabinet.height
                        ? `${cabinet.width}mm × ${cabinet.height}mm`
                        : cabinet.width
                        ? `${cabinet.width}mm`
                        : 'No dimensions'}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No cabinets found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Details */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-y-auto">
          {isCreating || selectedCabinet ? (
            <div className="p-6">
              {/* Header with Edit/Save buttons */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <h4 className="text-lg font-semibold text-gray-900">
                  {isCreating ? 'New Cabinet' : (selectedCabinet?.name || 'Cabinet Details')}
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
                        onClick={() => selectedCabinet && handleDelete(selectedCabinet)}
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
                    Cabinet Name (Optional)
                  </label>
                  {isEditing || isCreating ? (
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Standard Base Cabinet 600mm"
                    />
                  ) : (
                    <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg">
                      {selectedCabinet?.name || '-'}
                    </div>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  {isEditing || isCreating ? (
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
                  ) : (
                    <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg capitalize">
                      {selectedCabinet?.category || '-'}
                    </div>
                  )}
                </div>

                {/* Type */}
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  {isEditing || isCreating ? (
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
                  ) : (
                    <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg">
                      {selectedCabinet?.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '-'}
                    </div>
                  )}
                </div>

                {/* Dimensions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dimensions (mm) *
                  </label>
                  {isEditing || isCreating ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="width" className="block text-xs text-gray-600 mb-1">Width</label>
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
                        <label htmlFor="height" className="block text-xs text-gray-600 mb-1">Height</label>
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
                        <label htmlFor="depth" className="block text-xs text-gray-600 mb-1">Depth</label>
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
                  ) : (
                    <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg">
                      {selectedCabinet?.width && selectedCabinet?.height && selectedCabinet?.depth
                        ? `${selectedCabinet.width}mm × ${selectedCabinet.height}mm × ${selectedCabinet.depth}mm`
                        : selectedCabinet?.width && selectedCabinet?.height
                        ? `${selectedCabinet.width}mm × ${selectedCabinet.height}mm`
                        : selectedCabinet?.width
                        ? `${selectedCabinet.width}mm`
                        : '-'}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
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
                      {selectedCabinet?.description || '-'}
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
              <p>Select a cabinet from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
