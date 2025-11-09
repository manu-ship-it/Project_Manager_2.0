'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Save, Trash2, X } from 'lucide-react'
import { useMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial } from '@/hooks/useMaterials'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useSettingValue, useUpdateSetting } from '@/hooks/useSettings'
import { Material } from '@/lib/supabase'

const edgeSizeOptions: Array<'21x1' | '21x2' | '29x1' | '29x2' | '38x1' | '38x2'> = [
  '21x1', '21x2', '29x1', '29x2', '38x1', '38x2'
]

export function MaterialsList() {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { data: materials, isLoading } = useMaterials()
  const { data: suppliers } = useSuppliers()
  const createMaterial = useCreateMaterial()
  const updateMaterial = useUpdateMaterial()
  const deleteMaterial = useDeleteMaterial()

  // Cut and Edge cost setting
  const { value: cutAndEdgeCost, isLoading: isLoadingSetting } = useSettingValue('cut_and_edge_cost_per_sheet', 110)
  const updateSetting = useUpdateSetting()
  const [cutAndEdgeCostInput, setCutAndEdgeCostInput] = useState<string>('')
  const [isEditingCutAndEdge, setIsEditingCutAndEdge] = useState(false)
  const [isSavingCutAndEdge, setIsSavingCutAndEdge] = useState(false)
  
  // Initialize input value when setting loads
  useEffect(() => {
    if (!isLoadingSetting && cutAndEdgeCostInput === '') {
      setCutAndEdgeCostInput(cutAndEdgeCost.toString())
    }
  }, [cutAndEdgeCost, isLoadingSetting])
  
  const handleSaveCutAndEdge = async () => {
    setIsSavingCutAndEdge(true)
    try {
      await updateSetting.mutateAsync({
        key: 'cut_and_edge_cost_per_sheet',
        value: cutAndEdgeCostInput,
      })
      setIsEditingCutAndEdge(false)
    } catch (error: any) {
      console.error('Error saving cut and edge cost:', error)
      alert(`Error saving cut and edge cost: ${error?.message || 'Failed to save'}`)
    } finally {
      setIsSavingCutAndEdge(false)
    }
  }
  
  const handleCancelCutAndEdge = () => {
    setCutAndEdgeCostInput(cutAndEdgeCost.toString())
    setIsEditingCutAndEdge(false)
  }

  const [formData, setFormData] = useState({
    name: '',
    material_type: '',
    thickness: '',
    length: '',
    width: '',
    edge_size: '',
    supplier_id: '',
    cost_per_unit: '',
    unit: 'units',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when material_type changes
  useEffect(() => {
    if (formData.material_type === 'Board/Laminate') {
      setFormData(prev => ({ ...prev, edge_size: '' }))
    } else if (formData.material_type === 'Edgetape') {
      setFormData(prev => ({ ...prev, length: '', width: '' }))
    }
  }, [formData.material_type])

  const handleSelectMaterial = (material: Material) => {
    setSelectedMaterial(material)
    setIsEditing(false)
    setIsCreating(false)
    setFormData({
      name: material.name || '',
      material_type: material.material_type || '',
      thickness: material.thickness?.toString() || '',
      length: material.length?.toString() || '',
      width: material.width?.toString() || '',
      edge_size: material.edge_size || '',
      supplier_id: material.supplier_id || '',
      cost_per_unit: material.cost_per_unit?.toString() || '',
      unit: material.unit || 'units',
    })
  }

  const handleEdit = () => {
    if (selectedMaterial) {
      setIsEditing(true)
    }
  }

  const handleCancel = () => {
    if (selectedMaterial) {
      setIsEditing(false)
      setFormData({
        name: selectedMaterial.name || '',
        material_type: selectedMaterial.material_type || '',
        thickness: selectedMaterial.thickness?.toString() || '',
        length: selectedMaterial.length?.toString() || '',
        width: selectedMaterial.width?.toString() || '',
        edge_size: selectedMaterial.edge_size || '',
        supplier_id: selectedMaterial.supplier_id || '',
        cost_per_unit: selectedMaterial.cost_per_unit?.toString() || '',
        unit: selectedMaterial.unit || 'units',
      })
    }
    setErrors({})
  }

  const handleCreateNew = () => {
    setIsCreating(true)
    setIsEditing(false)
    setSelectedMaterial(null)
    setFormData({
      name: '',
      material_type: '',
      thickness: '',
      length: '',
      width: '',
      edge_size: '',
      supplier_id: '',
      cost_per_unit: '',
      unit: 'units',
    })
    setErrors({})
  }

  const handleSave = async () => {
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
        materialData.length = null
        materialData.width = null
        materialData.edge_size = null
      }

      if (isCreating) {
        const newMaterial = await createMaterial.mutateAsync(materialData)
        setSelectedMaterial(newMaterial)
        setIsCreating(false)
        setIsEditing(false)
      } else if (selectedMaterial) {
        const updatedMaterial = await updateMaterial.mutateAsync({
          id: selectedMaterial.id,
          ...materialData,
        })
        setIsEditing(false)
        setSelectedMaterial(updatedMaterial)
      }
    } catch (error: any) {
      console.error('Error saving material:', error)
      const errorMessage = error?.message || error?.error_description || error?.details || 'Failed to save material. Please try again.'
      setErrors({ submit: errorMessage })
      alert(`Error saving material: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (material: Material) => {
    if (confirm(`Are you sure you want to delete "${material.name}"?`)) {
      try {
        await deleteMaterial.mutateAsync(material.id)
        if (selectedMaterial?.id === material.id) {
          setSelectedMaterial(null)
          setIsEditing(false)
        }
      } catch (error: any) {
        console.error('Error deleting material:', error)
        const errorMessage = error?.message || error?.error_description || error?.details || 'Failed to delete material. Please try again.'
        alert(`Error deleting material: ${errorMessage}`)
      }
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Calculate square meter rate for Board/Laminate materials
  const calculateSquareMeterRate = (material: Material): number | null => {
    if (material.material_type !== 'Board/Laminate') {
      return null
    }
    
    if (
      material.cost_per_unit !== null &&
      material.cost_per_unit !== undefined &&
      material.length !== null &&
      material.length !== undefined &&
      material.width !== null &&
      material.width !== undefined &&
      material.length > 0 &&
      material.width > 0
    ) {
      const areaInSquareMeters = (material.length * material.width) / 1000000
      return material.cost_per_unit / areaInSquareMeters
    }
    
    return null
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
          <h3 className="text-lg font-semibold text-gray-900">Materials Library</h3>
          <p className="text-sm text-gray-600">Manage global materials library (available to all projects)</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Material</span>
        </button>
      </div>

      {/* Side Panel Layout */}
      <div className="flex gap-6 h-[calc(100vh-300px)]">
        {/* Left Panel - List of Names */}
        <div className="w-1/3 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-semibold text-gray-900">Materials ({materials?.length || 0})</h4>
          </div>
          <div className="flex-1 overflow-y-auto">
      {materials && materials.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {materials.map((material) => (
                  <button
                    key={material.id}
                    onClick={() => handleSelectMaterial(material)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      selectedMaterial?.id === material.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                        {material.name}
                      </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {material.material_type || 'No type'} • {material.cost_per_unit ? `$${material.cost_per_unit.toFixed(2)}` : 'No cost'}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No materials found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Details */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-y-auto">
          {isCreating || selectedMaterial ? (
            <div className="p-6">
              {/* Header with Edit/Save buttons */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <h4 className="text-lg font-semibold text-gray-900">
                  {isCreating ? 'New Material' : selectedMaterial?.name}
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
                        onClick={() => selectedMaterial && handleDelete(selectedMaterial)}
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
                {/* Material Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Material Name *
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
                      placeholder="e.g., Oak Veneer, Hardware Set"
                    />
                  ) : (
                    <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg">
                      {selectedMaterial?.name || '-'}
                    </div>
                  )}
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Material Type */}
                <div>
                  <label htmlFor="material_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Material Type
                  </label>
                  {isEditing || isCreating ? (
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
                  ) : (
                    <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg">
                      {selectedMaterial?.material_type || '-'}
                    </div>
                  )}
                </div>

                {/* Thickness */}
                <div>
                  <label htmlFor="thickness" className="block text-sm font-medium text-gray-700 mb-1">
                    Thickness (mm)
                  </label>
                  {isEditing || isCreating ? (
                    <input
                      type="number"
                      id="thickness"
                      step="0.1"
                      value={formData.thickness}
                      onChange={(e) => handleChange('thickness', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 18.0"
                    />
                  ) : (
                    <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg">
                      {selectedMaterial?.thickness ? `${selectedMaterial.thickness}mm` : '-'}
                    </div>
                  )}
                </div>

                {/* Board/Laminate Fields: Length and Width */}
                {(formData.material_type === 'Board/Laminate' || selectedMaterial?.material_type === 'Board/Laminate') && (
                  <>
                    <div>
                      <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-1">
                        Length (mm) *
                      </label>
                      {isEditing || isCreating ? (
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
                      ) : (
                        <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg">
                          {selectedMaterial?.length ? `${selectedMaterial.length}mm` : '-'}
                        </div>
                      )}
                      {errors.length && (
                        <p className="text-red-500 text-sm mt-1">{errors.length}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-1">
                        Width (mm) *
                      </label>
                      {isEditing || isCreating ? (
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
                      ) : (
                        <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg">
                          {selectedMaterial?.width ? `${selectedMaterial.width}mm` : '-'}
                        </div>
                      )}
                      {errors.width && (
                        <p className="text-red-500 text-sm mt-1">{errors.width}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Edgetape Field: Edge Size */}
                {(formData.material_type === 'Edgetape' || selectedMaterial?.material_type === 'Edgetape') && (
                  <div>
                    <label htmlFor="edge_size" className="block text-sm font-medium text-gray-700 mb-1">
                      Edge Size *
                    </label>
                    {isEditing || isCreating ? (
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
                    ) : (
                      <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg">
                        {selectedMaterial?.edge_size || '-'}
                      </div>
                    )}
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
                      {selectedMaterial?.supplier?.name || '-'}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 10.50"
                    />
                  ) : (
                    <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg">
                      {selectedMaterial?.cost_per_unit !== null && selectedMaterial?.cost_per_unit !== undefined
                        ? `$${selectedMaterial.cost_per_unit.toFixed(2)}${selectedMaterial.unit ? `/${selectedMaterial.unit}` : ''}`
                          : '-'}
                      </div>
                  )}
                </div>

                {/* Unit */}
                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  {isEditing || isCreating ? (
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
                  ) : (
                    <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg capitalize">
                      {selectedMaterial?.unit || '-'}
                    </div>
                  )}
                </div>

                {/* Square Meter Rate (read-only, calculated) */}
                {selectedMaterial && !isEditing && !isCreating && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Square Meter Rate
                    </label>
                    <div className="px-3 py-2 text-gray-900 bg-gray-50 rounded-lg font-medium">
                      {calculateSquareMeterRate(selectedMaterial) !== null
                        ? `$${calculateSquareMeterRate(selectedMaterial)!.toFixed(2)}/m²`
                          : '-'}
                      </div>
                  </div>
                )}

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
              <p>Select a material from the list to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Cut and Edge Cost Variable */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cut and Edge Cost (for backend calculations)
            </label>
            {isEditingCutAndEdge ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 flex-1">
                  <span className="text-gray-600">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cutAndEdgeCostInput}
                    onChange={(e) => setCutAndEdgeCostInput(e.target.value)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="110.00"
                  />
                  <span className="text-gray-600">/ sheet</span>
                      </div>
                <div className="flex items-center space-x-2">
                        <button
                    onClick={handleCancelCutAndEdge}
                    className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                    Cancel
                        </button>
                        <button
                    onClick={handleSaveCutAndEdge}
                    disabled={isSavingCutAndEdge}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSavingCutAndEdge ? 'Saving...' : 'Save'}</span>
                        </button>
                      </div>
        </div>
      ) : (
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-900">
                  ${cutAndEdgeCost.toFixed(2)} / sheet
          </div>
          <button
                  onClick={() => setIsEditingCutAndEdge(true)}
                  className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
          </button>
        </div>
      )}
          </div>
        </div>
      </div>
    </div>
  )
}
