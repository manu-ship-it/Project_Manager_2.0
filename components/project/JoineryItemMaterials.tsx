'use client'

import { useState } from 'react'
import { Plus, X, Edit, Trash2, Package, Hash } from 'lucide-react'
import { useJoineryItemMaterials, useAddJoineryItemMaterial, useUpdateJoineryItemMaterial, useRemoveJoineryItemMaterial } from '@/hooks/useJoineryItemMaterials'
import { useMaterials } from '@/hooks/useMaterials'
import { JoineryItemMaterial } from '@/lib/supabase'

interface JoineryItemMaterialsProps {
  joineryItemId: string
}

export function JoineryItemMaterials({ joineryItemId }: JoineryItemMaterialsProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<JoineryItemMaterial | null>(null)
  const { data: materials, isLoading: materialsLoading } = useJoineryItemMaterials(joineryItemId)
  const { data: allMaterials, isLoading: allMaterialsLoading } = useMaterials()
  const addMaterial = useAddJoineryItemMaterial()
  const updateMaterial = useUpdateJoineryItemMaterial()
  const removeMaterial = useRemoveJoineryItemMaterial()

  // All materials are available (can add same material multiple times)
  const availableMaterials = allMaterials || []

  const handleAdd = async (materialId: string, quantity: number) => {
    try {
      await addMaterial.mutateAsync({
        joinery_item_id: joineryItemId,
        material_id: materialId,
        quantity,
      })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding material:', error)
      alert('Failed to add material. Please try again.')
    }
  }

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    try {
      await updateMaterial.mutateAsync({ id, quantity })
      setEditingMaterial(null)
    } catch (error) {
      console.error('Error updating quantity:', error)
      alert('Failed to update quantity. Please try again.')
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this material?')) return
    
    try {
      await removeMaterial.mutateAsync({ id, joinery_item_id: joineryItemId })
    } catch (error) {
      console.error('Error removing material:', error)
      alert('Failed to remove material. Please try again.')
    }
  }

  if (materialsLoading || allMaterialsLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Check if there are any materials in the library at all
  const hasMaterialsInLibrary = (allMaterials?.length || 0) > 0

  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-between items-center">
        <h5 className="text-sm font-medium text-gray-700">Materials</h5>
        {hasMaterialsInLibrary && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-3 w-3" />
            <span>Add Material</span>
          </button>
        )}
      </div>

      {/* Materials List */}
      {materials && materials.length > 0 ? (
        <div className="space-y-2">
          {materials.map((jm) => (
            <MaterialRow
              key={jm.id}
              joineryItemMaterial={jm}
              isEditing={editingMaterial?.id === jm.id}
              onEdit={() => setEditingMaterial(jm)}
              onCancelEdit={() => setEditingMaterial(null)}
              onUpdateQuantity={(quantity) => handleUpdateQuantity(jm.id, quantity)}
              onRemove={() => handleRemove(jm.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 py-2">
          {hasMaterialsInLibrary ? (
            'No materials assigned. Click "Add Material" to get started.'
          ) : (
            'No materials in library. Add materials to the global library first from the Materials tab.'
          )}
        </div>
      )}

      {/* Add Material Form */}
      {showAddForm && (
        <AddMaterialForm
          availableMaterials={availableMaterials}
          onAdd={handleAdd}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Show message if trying to add but no materials available */}
      {showAddForm && availableMaterials.length === 0 && (
        <div className="p-3 bg-yellow-50 rounded border border-yellow-200 text-sm text-yellow-800">
          No materials available in the library. Please add materials to the library first.
        </div>
      )}
    </div>
  )
}

function MaterialRow({
  joineryItemMaterial,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdateQuantity,
  onRemove,
}: {
  joineryItemMaterial: JoineryItemMaterial
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onUpdateQuantity: (quantity: number) => void
  onRemove: () => void
}) {
  const [quantity, setQuantity] = useState(joineryItemMaterial.quantity.toString())

  const material = joineryItemMaterial.material

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded border">
        <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {material?.name || 'Unknown Material'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
          />
          <button
            onClick={() => onUpdateQuantity(parseFloat(quantity) || 0)}
            className="text-green-600 hover:text-green-700"
            title="Save"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={onCancelEdit}
            className="text-gray-400 hover:text-gray-600"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded border hover:bg-gray-100 transition-colors">
      <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {material?.name || 'Unknown Material'}
        </p>
        {material?.supplier && (
          <p className="text-xs text-gray-500 truncate">
            Supplier: {material.supplier.name}
          </p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Hash className="h-3 w-3 text-gray-400" />
          <span className="text-sm text-gray-700">{joineryItemMaterial.quantity}</span>
        </div>
        <button
          onClick={onEdit}
          className="text-gray-400 hover:text-blue-600 transition-colors"
          title="Edit quantity"
        >
          <Edit className="h-3 w-3" />
        </button>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-600 transition-colors"
          title="Remove"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

function AddMaterialForm({
  availableMaterials,
  onAdd,
  onClose,
}: {
  availableMaterials: any[]
  onAdd: (materialId: string, quantity: number) => void
  onClose: () => void
}) {
  const [selectedMaterialId, setSelectedMaterialId] = useState('')
  const [quantity, setQuantity] = useState('1')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMaterialId || !quantity || parseFloat(quantity) <= 0) {
      alert('Please select a material and enter a valid quantity.')
      return
    }
    onAdd(selectedMaterialId, parseFloat(quantity))
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-blue-50 rounded border border-blue-200 space-y-2">
      <div className="flex items-center space-x-2">
        <select
          value={selectedMaterialId}
          onChange={(e) => setSelectedMaterialId(e.target.value)}
          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
          required
        >
          <option value="">Select material...</option>
          {availableMaterials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Qty"
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
          required
        />
        <button
          type="submit"
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}

