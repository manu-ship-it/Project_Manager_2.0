'use client'

import { useState } from 'react'
import { Plus, X, Edit, Trash2, Box, Hash, Ruler } from 'lucide-react'
import { useCabinets, useCreateCabinet, useUpdateCabinet, useDeleteCabinet } from '@/hooks/useCabinets'
import { useTemplateCabinets } from '@/hooks/useTemplateCabinets'
import { CabinetHardware } from './CabinetHardware'
import { CabinetMaterials } from './CabinetMaterials'
import { Cabinet } from '@/lib/supabase'

interface JoineryItemCabinetsProps {
  joineryItemId: string
}

export function JoineryItemCabinets({ joineryItemId }: JoineryItemCabinetsProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCabinet, setEditingCabinet] = useState<Cabinet | null>(null)
  const { data: cabinets, isLoading: cabinetsLoading } = useCabinets(joineryItemId)
  const { data: allCabinets } = useTemplateCabinets()
  const addCabinet = useCreateCabinet()
  const updateCabinet = useUpdateCabinet()
  const removeCabinet = useDeleteCabinet()

  // All cabinets are available (can add same cabinet multiple times)
  const availableCabinets = allCabinets || []

  const handleAdd = async (cabinetId: string, quantity: number, customDimensions?: { width?: number; height?: number; depth?: number }, notes?: string) => {
    try {
      // Get the template cabinet to copy default values
      const templateCabinet = allCabinets?.find(c => c.id === cabinetId)
      
      await addCabinet.mutateAsync({
        joinery_item_id: joineryItemId,
        template_id: cabinetId,
        quantity,
        type: templateCabinet?.type || null,
        category: templateCabinet?.category || null,
        name: templateCabinet?.name || null,
        width: customDimensions?.width || templateCabinet?.width || null,
        height: customDimensions?.height || templateCabinet?.height || null,
        depth: customDimensions?.depth || templateCabinet?.depth || null,
        quote: false, // This is a project cabinet
        created_by: null,
        assigned_face_material: templateCabinet?.assigned_face_material || 1,
        extra_hinges: 0,
        extra_drawers: 0,
        end_panels_qty: templateCabinet?.end_panels_qty || 0,
        hinge_qty: templateCabinet?.hinge_qty || null,
        drawer_qty: templateCabinet?.drawer_qty || 0,
        door_qty: templateCabinet?.door_qty || 0,
        shelf_qty: templateCabinet?.shelf_qty || 0,
        drawer_hardware_qty: templateCabinet?.drawer_hardware_qty || null,
      })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding cabinet:', error)
      alert('Failed to add cabinet. Please try again.')
    }
  }

  const handleUpdate = async (id: string, updates: Partial<Cabinet>) => {
    try {
      await updateCabinet.mutateAsync({ id, ...updates })
      setEditingCabinet(null)
    } catch (error) {
      console.error('Error updating cabinet:', error)
      alert('Failed to update cabinet. Please try again.')
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this cabinet?')) return
    
    try {
      await removeCabinet.mutateAsync({ id, joinery_item_id: joineryItemId })
    } catch (error) {
      console.error('Error removing cabinet:', error)
      alert('Failed to remove cabinet. Please try again.')
    }
  }

  if (cabinetsLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Check if there are any cabinets in the library at all
  const hasCabinetsInLibrary = (allCabinets?.length || 0) > 0

  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-between items-center">
        <h5 className="text-sm font-medium text-gray-700">Cabinets</h5>
        {hasCabinetsInLibrary && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-3 w-3" />
            <span>Add Cabinet</span>
          </button>
        )}
      </div>

      {/* Cabinets List */}
      {cabinets && cabinets.length > 0 ? (
        <div className="space-y-2">
          {cabinets.map((jc) => (
            <CabinetRow
              key={jc.id}
              joineryItemCabinet={jc}
              isEditing={editingCabinet?.id === jc.id}
              onEdit={() => setEditingCabinet(jc)}
              onCancelEdit={() => setEditingCabinet(null)}
              onUpdate={(updates) => handleUpdate(jc.id, updates)}
              onRemove={() => handleRemove(jc.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 py-2">
          {hasCabinetsInLibrary ? (
            'No cabinets assigned. Click "Add Cabinet" to get started.'
          ) : (
            'No cabinets in library. Add standard cabinets to the library first from the Standard Cabinets page.'
          )}
        </div>
      )}

      {/* Add Cabinet Form */}
      {showAddForm && (
        <AddCabinetForm
          availableCabinets={availableCabinets}
          onAdd={handleAdd}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Show message if trying to add but no cabinets available */}
      {showAddForm && availableCabinets.length === 0 && (
        <div className="p-3 bg-yellow-50 rounded border border-yellow-200 text-sm text-yellow-800">
          No cabinets available in the library. Please add cabinets to the library first.
        </div>
      )}
    </div>
  )
}

function CabinetRow({
  joineryItemCabinet,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onRemove,
}: {
  joineryItemCabinet: Cabinet
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onUpdate: (updates: Partial<Cabinet>) => void
  onRemove: () => void
}) {
  const [quantity, setQuantity] = useState(joineryItemCabinet.quantity.toString())
  const [width, setWidth] = useState(joineryItemCabinet.width?.toString() || '')
  const [height, setHeight] = useState(joineryItemCabinet.height?.toString() || '')
  const [depth, setDepth] = useState(joineryItemCabinet.depth?.toString() || '')

  const cabinet = joineryItemCabinet.template_cabinet
  const hasCustomDimensions = joineryItemCabinet.width !== cabinet?.width || 
                              joineryItemCabinet.height !== cabinet?.height || 
                              joineryItemCabinet.depth !== cabinet?.depth

  // Get effective dimensions (use cabinet's own values)
  const effectiveWidth = joineryItemCabinet.width ?? cabinet?.width ?? 0
  const effectiveHeight = joineryItemCabinet.height ?? cabinet?.height ?? 0
  const effectiveDepth = joineryItemCabinet.depth ?? cabinet?.depth ?? 0

  if (isEditing) {
    return (
      <div className="p-3 bg-blue-50 rounded border border-blue-200 space-y-3">
        <div className="flex items-center space-x-2">
          <Box className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {joineryItemCabinet.name || cabinet?.name || `${joineryItemCabinet.category || cabinet?.category} - ${joineryItemCabinet.type || cabinet?.type}` || 'Unknown Cabinet'}
            </p>
            {cabinet && (
              <p className="text-xs text-gray-500">
                Template: {cabinet.width}mm × {cabinet.height}mm × {cabinet.depth}mm
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Dimensions (mm)</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Width</label>
              <input
                type="number"
                step="0.01"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder={cabinet?.width?.toString() || '0'}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Height</label>
              <input
                type="number"
                step="0.01"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder={cabinet?.height?.toString() || '0'}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Depth</label>
              <input
                type="number"
                step="0.01"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                placeholder={cabinet?.depth?.toString() || '0'}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUpdate({
              quantity: parseInt(quantity) || 1,
              width: width ? parseFloat(width) : null,
              height: height ? parseFloat(height) : null,
              depth: depth ? parseFloat(depth) : null,
            })}
            className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={onCancelEdit}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded border hover:bg-gray-100 transition-colors">
        <Box className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {joineryItemCabinet.name || cabinet?.name || `${joineryItemCabinet.category || cabinet?.category} - ${joineryItemCabinet.type || cabinet?.type}` || 'Unknown Cabinet'}
          </p>
          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
            <div className="flex items-center space-x-1">
              <Ruler className="h-3 w-3" />
              <span>
                {effectiveWidth}mm × {effectiveHeight}mm × {effectiveDepth}mm
                {hasCustomDimensions && <span className="text-blue-600 ml-1">(custom)</span>}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Hash className="h-3 w-3 text-gray-400" />
            <span className="text-sm text-gray-700">{joineryItemCabinet.quantity}</span>
          </div>
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit cabinet"
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
      
      {/* Hardware Section */}
      <CabinetHardware cabinetId={joineryItemCabinet.id} />

      {/* Material Overrides Section */}
      <CabinetMaterials 
        cabinetId={joineryItemCabinet.id}
      />
    </div>
  )
}

function AddCabinetForm({
  availableCabinets,
  onAdd,
  onClose,
}: {
  availableCabinets: any[]
  onAdd: (cabinetId: string, quantity: number, customDimensions?: { width?: number; height?: number; depth?: number }, notes?: string) => void
  onClose: () => void
}) {
  const [selectedCabinetId, setSelectedCabinetId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [customWidth, setCustomWidth] = useState('')
  const [customHeight, setCustomHeight] = useState('')
  const [customDepth, setCustomDepth] = useState('')
  const [notes, setNotes] = useState('')

  const selectedCabinet = availableCabinets.find(c => c.id === selectedCabinetId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCabinetId || !quantity || parseFloat(quantity) <= 0) {
      alert('Please select a cabinet and enter a valid quantity.')
      return
    }
    
    const customDimensions = (customWidth || customHeight || customDepth) ? {
      width: customWidth ? parseFloat(customWidth) : undefined,
      height: customHeight ? parseFloat(customHeight) : undefined,
      depth: customDepth ? parseFloat(customDepth) : undefined,
    } : undefined

    onAdd(selectedCabinetId, parseFloat(quantity), customDimensions, notes.trim() || undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-blue-50 rounded border border-blue-200 space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Select Cabinet</label>
        <select
          value={selectedCabinetId}
          onChange={(e) => setSelectedCabinetId(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          required
        >
          <option value="">Select cabinet...</option>
          {availableCabinets.map((cabinet) => (
            <option key={cabinet.id} value={cabinet.id}>
              {cabinet.name || `${cabinet.category} - ${cabinet.type}`} ({cabinet.width}×{cabinet.height}×{cabinet.depth}mm)
            </option>
          ))}
        </select>
      </div>

      {selectedCabinet && (
        <div className="text-xs text-gray-600 bg-white p-2 rounded">
          Template: {selectedCabinet.width}mm × {selectedCabinet.height}mm × {selectedCabinet.depth}mm
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Custom Dimensions (optional)</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Width (mm)</label>
            <input
              type="number"
              step="0.01"
              value={customWidth}
              onChange={(e) => setCustomWidth(e.target.value)}
              placeholder={selectedCabinet?.width?.toString() || '0'}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Height (mm)</label>
            <input
              type="number"
              step="0.01"
              value={customHeight}
              onChange={(e) => setCustomHeight(e.target.value)}
              placeholder={selectedCabinet?.height?.toString() || '0'}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Depth (mm)</label>
            <input
              type="number"
              step="0.01"
              value={customDepth}
              onChange={(e) => setCustomDepth(e.target.value)}
              placeholder={selectedCabinet?.depth?.toString() || '0'}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex items-center space-x-2">
        <button
          type="submit"
          className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
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

