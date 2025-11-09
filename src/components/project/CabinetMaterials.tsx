'use client'

import { useState } from 'react'
import { Plus, X, Edit, Trash2, Package, Hash, AlertCircle } from 'lucide-react'
import { useCabinetMaterials, useAddCabinetMaterial, useUpdateCabinetMaterial, useRemoveCabinetMaterial } from '@/hooks/useCabinetMaterials'
import { useMaterials } from '@/hooks/useMaterials'
import { CabJoinMaterial } from '@/lib/supabase'

interface CabinetMaterialsProps {
  cabinetId: string
}

export function CabinetMaterials({ cabinetId }: CabinetMaterialsProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<CabJoinMaterial | null>(null)
  const { data: cabinetMaterials, isLoading: cabinetMaterialsLoading } = useCabinetMaterials(cabinetId)
  const { data: allMaterials } = useMaterials()
  const addMaterial = useAddCabinetMaterial()
  const updateMaterial = useUpdateCabinetMaterial()
  const removeMaterial = useRemoveCabinetMaterial()

  // All materials are available (can add same material multiple times as overrides)
  const availableMaterials = allMaterials || []

  // Check if cabinet has material overrides
  const hasOverrides = (cabinetMaterials?.length || 0) > 0

  const handleAdd = async (materialId: string, quantity: number, notes?: string) => {
    try {
      await addMaterial.mutateAsync({
        cab_id: cabinetId,
        material_id: materialId,
        qty: quantity,
        notes: notes || null,
      })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding material override:', error)
      alert('Failed to add material override. Please try again.')
    }
  }

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    try {
      await updateMaterial.mutateAsync({ id, qty: quantity })
      setEditingMaterial(null)
    } catch (error) {
      console.error('Error updating quantity:', error)
      alert('Failed to update quantity. Please try again.')
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this material override?')) return
    
    try {
      await removeMaterial.mutateAsync({ id, cab_id: cabinetId })
    } catch (error) {
      console.error('Error removing material override:', error)
      alert('Failed to remove material override. Please try again.')
    }
  }

  if (cabinetMaterialsLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Check if there are any materials in the library at all
  const hasMaterialsInLibrary = (allMaterials?.length || 0) > 0

  return (
    <div className="ml-6 mt-2 space-y-2 border-l-2 border-gray-200 pl-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h6 className="text-xs font-medium text-gray-600">Material Overrides</h6>
          {hasOverrides && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
              Override Active
            </span>
          )}
        </div>
        {hasMaterialsInLibrary && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-3 w-3" />
            <span>Add Override</span>
          </button>
        )}
      </div>

      {/* Info message - removed joinery item materials reference for now */}

      {/* Override Materials List */}
      {hasOverrides ? (
        <div className="space-y-1">
          {cabinetMaterials?.map((cm) => (
            <MaterialRow
              key={cm.id}
              cabinetMaterial={cm}
              isEditing={editingMaterial?.id === cm.id}
              onEdit={() => setEditingMaterial(cm)}
              onCancelEdit={() => setEditingMaterial(null)}
              onUpdateQuantity={(quantity) => handleUpdateQuantity(cm.id, quantity)}
              onRemove={() => handleRemove(cm.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-400 py-1">
          {hasMaterialsInLibrary ? (
            'No material overrides. Using joinery item materials.'
          ) : (
            'No materials in library.'
          )}
        </div>
      )}

      {/* Add Material Override Form */}
      {showAddForm && (
        <AddMaterialForm
          availableMaterials={availableMaterials}
          onAdd={handleAdd}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Show message if trying to add but no materials available */}
      {showAddForm && availableMaterials.length === 0 && (
        <div className="p-2 bg-yellow-50 rounded border border-yellow-200 text-xs text-yellow-800">
          No materials available in the library. Please add materials to the library first.
        </div>
      )}
    </div>
  )
}

function MaterialRow({
  cabinetMaterial,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdateQuantity,
  onRemove,
}: {
  cabinetMaterial: CabJoinMaterial
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onUpdateQuantity: (quantity: number) => void
  onRemove: () => void
}) {
  const [quantity, setQuantity] = useState(cabinetMaterial.qty.toString())

  const material = cabinetMaterial.material

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2 p-1.5 bg-blue-50 rounded border border-blue-200">
        <Package className="h-3 w-3 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-900 truncate">
            {material?.name || 'Unknown Material'}
          </p>
        </div>
        <div className="flex items-center space-x-1">
          <input
            type="number"
            min="0"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-20 px-1.5 py-0.5 text-xs border border-gray-300 rounded"
          />
          <button
            onClick={() => onUpdateQuantity(parseFloat(quantity) || 0)}
            className="text-green-600 hover:text-green-700"
            title="Save"
          >
            <Edit className="h-3 w-3" />
          </button>
          <button
            onClick={onCancelEdit}
            className="text-gray-400 hover:text-gray-600"
            title="Cancel"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 p-1.5 bg-orange-50 rounded border border-orange-200 hover:bg-orange-100 transition-colors">
      <Package className="h-3 w-3 text-orange-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 truncate">
          {material?.name || 'Unknown Material'}
        </p>
        {material?.supplier && (
          <p className="text-xs text-gray-500 truncate">
            Supplier: {material.supplier.name}
          </p>
        )}
        {cabinetMaterial.notes && (
          <p className="text-xs text-gray-400 italic">{cabinetMaterial.notes}</p>
        )}
      </div>
      <div className="flex items-center space-x-1">
        <div className="flex items-center space-x-0.5">
          <Hash className="h-2.5 w-2.5 text-gray-400" />
          <span className="text-xs text-gray-700">{cabinetMaterial.qty}</span>
        </div>
        <button
          onClick={onEdit}
          className="text-gray-400 hover:text-blue-600 transition-colors"
          title="Edit quantity"
        >
          <Edit className="h-2.5 w-2.5" />
        </button>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-600 transition-colors"
          title="Remove override"
        >
          <Trash2 className="h-2.5 w-2.5" />
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
  onAdd: (materialId: string, quantity: number, notes?: string) => void
  onClose: () => void
}) {
  const [selectedMaterialId, setSelectedMaterialId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMaterialId || !quantity || parseFloat(quantity) <= 0) {
      alert('Please select a material and enter a valid quantity.')
      return
    }
    onAdd(selectedMaterialId, parseFloat(quantity), notes.trim() || undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="p-2 bg-orange-50 rounded border border-orange-200 space-y-2">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Select Material to Override</label>
        <select
          value={selectedMaterialId}
          onChange={(e) => setSelectedMaterialId(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
          required
        >
          <option value="">Select material...</option>
          {availableMaterials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.name}
              {material.supplier && ` (${material.supplier.name})`}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">Quantity</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-0.5">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
          placeholder="e.g., Custom finish for this cabinet..."
        />
      </div>

      <div className="flex items-center space-x-2">
        <button
          type="submit"
          className="flex-1 px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Add Override
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </form>
  )
}

