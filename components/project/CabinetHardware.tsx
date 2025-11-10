'use client'

import { useState } from 'react'
import { Plus, X, Edit, Trash2, Wrench, Hash } from 'lucide-react'
import { useCabinetHardware, useAddCabinetHardware, useUpdateCabinetHardware, useRemoveCabinetHardware } from '@/hooks/useCabinetHardware'
import { useHardware } from '@/hooks/useHardware'
import { CabJoinHardware } from '@/lib/supabase'

interface CabinetHardwareProps {
  cabinetId: string
}

export function CabinetHardware({ cabinetId }: CabinetHardwareProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingHardware, setEditingHardware] = useState<CabJoinHardware | null>(null)
  const { data: hardware, isLoading: hardwareLoading } = useCabinetHardware(cabinetId)
  const { data: allHardware } = useHardware()
  const addHardware = useAddCabinetHardware()
  const updateHardware = useUpdateCabinetHardware()
  const removeHardware = useRemoveCabinetHardware()

  // All hardware is available (can add same hardware multiple times)
  const availableHardware = allHardware || []

  const handleAdd = async (hardwareId: string, quantity: number, notes?: string) => {
    try {
      await addHardware.mutateAsync({
        cab_id: cabinetId,
        hardware_id: hardwareId,
        qty: quantity,
        notes: notes || null,
      })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding hardware:', error)
      alert('Failed to add hardware. Please try again.')
    }
  }

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    try {
      await updateHardware.mutateAsync({ id, qty: quantity })
      setEditingHardware(null)
    } catch (error) {
      console.error('Error updating quantity:', error)
      alert('Failed to update quantity. Please try again.')
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this hardware?')) return
    
    try {
      await removeHardware.mutateAsync({ id, cab_id: cabinetId })
    } catch (error) {
      console.error('Error removing hardware:', error)
      alert('Failed to remove hardware. Please try again.')
    }
  }

  if (hardwareLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Check if there are any hardware items in the library at all
  const hasHardwareInLibrary = (allHardware?.length || 0) > 0

  return (
    <div className="ml-6 mt-2 space-y-2 border-l-2 border-gray-200 pl-3">
      <div className="flex justify-between items-center">
        <h6 className="text-xs font-medium text-gray-600">Hardware</h6>
        {hasHardwareInLibrary && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-3 w-3" />
            <span>Add</span>
          </button>
        )}
      </div>

      {/* Hardware List */}
      {hardware && hardware.length > 0 ? (
        <div className="space-y-1">
          {hardware.map((ch) => (
            <HardwareRow
              key={ch.id}
              cabinetHardware={ch}
              isEditing={editingHardware?.id === ch.id}
              onEdit={() => setEditingHardware(ch)}
              onCancelEdit={() => setEditingHardware(null)}
              onUpdateQuantity={(quantity) => handleUpdateQuantity(ch.id, quantity)}
              onRemove={() => handleRemove(ch.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-400 py-1">
          {hasHardwareInLibrary ? (
            'No hardware assigned'
          ) : (
            'No hardware in library'
          )}
        </div>
      )}

      {/* Add Hardware Form */}
      {showAddForm && (
        <AddHardwareForm
          availableHardware={availableHardware}
          onAdd={handleAdd}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Show message if trying to add but no hardware available */}
      {showAddForm && availableHardware.length === 0 && (
        <div className="p-2 bg-yellow-50 rounded border border-yellow-200 text-xs text-yellow-800">
          No hardware available in the library. Please add hardware to the library first.
        </div>
      )}
    </div>
  )
}

function HardwareRow({
  cabinetHardware,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdateQuantity,
  onRemove,
}: {
  cabinetHardware: CabJoinHardware
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onUpdateQuantity: (quantity: number) => void
  onRemove: () => void
}) {
  const [quantity, setQuantity] = useState(cabinetHardware.qty.toString())

  const hardware = cabinetHardware.hardware

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2 p-1.5 bg-blue-50 rounded border border-blue-200">
        <Wrench className="h-3 w-3 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-900 truncate">
            {hardware?.name || 'Unknown Hardware'}
          </p>
        </div>
        <div className="flex items-center space-x-1">
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-16 px-1.5 py-0.5 text-xs border border-gray-300 rounded"
          />
          <button
            onClick={() => onUpdateQuantity(parseInt(quantity) || 1)}
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
    <div className="flex items-center space-x-2 p-1.5 bg-gray-50 rounded border hover:bg-gray-100 transition-colors">
      <Wrench className="h-3 w-3 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 truncate">
          {hardware?.name || 'Unknown Hardware'}
        </p>
        {hardware && hardware.cost_per_unit && hardware.cost_per_unit > 0 && (
          <p className="text-xs text-gray-500">
            ${hardware.cost_per_unit.toFixed(2)}/unit
          </p>
        )}
        {cabinetHardware.notes && (
          <p className="text-xs text-gray-400 italic">{cabinetHardware.notes}</p>
        )}
      </div>
      <div className="flex items-center space-x-1">
        <div className="flex items-center space-x-0.5">
          <Hash className="h-2.5 w-2.5 text-gray-400" />
          <span className="text-xs text-gray-700">{cabinetHardware.qty}</span>
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
          title="Remove"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  )
}

function AddHardwareForm({
  availableHardware,
  onAdd,
  onClose,
}: {
  availableHardware: any[]
  onAdd: (hardwareId: string, quantity: number, notes?: string) => void
  onClose: () => void
}) {
  const [selectedHardwareId, setSelectedHardwareId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedHardwareId || !quantity || parseFloat(quantity) <= 0) {
      alert('Please select hardware and enter a valid quantity.')
      return
    }
    onAdd(selectedHardwareId, parseFloat(quantity), notes.trim() || undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="p-2 bg-blue-50 rounded border border-blue-200 space-y-2">
      <div>
        <select
          value={selectedHardwareId}
          onChange={(e) => setSelectedHardwareId(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
          required
        >
          <option value="">Select hardware...</option>
          {availableHardware.map((hw) => (
            <option key={hw.id} value={hw.id}>
              {hw.name} {hw.cost_per_unit > 0 && `($${hw.cost_per_unit.toFixed(2)})`}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-600 mb-0.5">Quantity</label>
          <input
            type="number"
            min="1"
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
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex items-center space-x-2">
        <button
          type="submit"
          className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add
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

