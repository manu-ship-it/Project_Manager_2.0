'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useSpecializedItems, useCreateSpecializedItem, useUpdateSpecializedItem, useDeleteSpecializedItem } from '@/hooks/useSpecializedItems'
import { useHardware } from '@/hooks/useHardware'
import { useMaterials } from '@/hooks/useMaterials'
import { JoineryItem, Hardware, Material, SpecializedItem } from '@/lib/supabase'

interface QuoteJoineryItemSpecializedItemsProps {
  joineryItem: JoineryItem
}

export function QuoteJoineryItemSpecializedItems({ joineryItem }: QuoteJoineryItemSpecializedItemsProps) {
  const { data: specializedItems, isLoading } = useSpecializedItems(joineryItem.id)
  const { data: allHardware } = useHardware()
  const { data: allMaterials } = useMaterials()
  const createItem = useCreateSpecializedItem()
  const updateItem = useUpdateSpecializedItem()
  const deleteItem = useDeleteSpecializedItem()

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this item?')) return
    
    try {
      await deleteItem.mutateAsync({ id, joinery_item_id: joineryItem.id })
    } catch (error: any) {
      console.error('Error deleting specialized item:', error)
      alert('Failed to delete specialized item. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalSpecializedCost = specializedItems?.reduce((sum, item) => sum + (item.total_cost || 0), 0) || 0

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h5 className="text-sm font-medium text-gray-700">Specialized Hardware/Materials</h5>
      </div>

      {/* Always show Add Specialized Item Form at the top */}
      <AddSpecializedItemForm
        allHardware={allHardware || []}
        allMaterials={allMaterials || []}
        onAdd={async (itemType, itemId, quantity) => {
          const selectedItem = itemType === 'hardware'
            ? allHardware?.find(h => h.id === itemId)
            : allMaterials?.find(m => m.id === itemId)

          if (!selectedItem) {
            alert('Please select an item.')
            return
          }

          try {
            await createItem.mutateAsync({
              joinery_item_id: joineryItem.id,
              item_type: itemType,
              item_id: itemId,
              quantity: quantity,
              unit_cost: selectedItem.cost_per_unit || 0,
              total_cost: (selectedItem.cost_per_unit || 0) * quantity,
              notes: null,
              created_by: null,
            })
          } catch (error: any) {
            console.error('Error adding specialized item:', error)
            const errorMessage = error?.message || error?.error_description || 'Unknown error occurred'
            alert(`Failed to add specialized item: ${errorMessage}`)
          }
        }}
      />

      {/* Existing Items */}
      {specializedItems && specializedItems.length > 0 && (
        <div className="space-y-2">
          {specializedItems.map((item) => (
            <SpecializedItemRow
              key={item.id}
              item={item}
              allHardware={allHardware || []}
              allMaterials={allMaterials || []}
              onUpdate={updateItem}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Total */}
      {totalSpecializedCost > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Total Specialized Items:</span>
            <span className="text-sm font-semibold text-gray-900">
              ${totalSpecializedCost.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function AddSpecializedItemForm({
  allHardware,
  allMaterials,
  onAdd,
}: {
  allHardware: Hardware[]
  allMaterials: Material[]
  onAdd: (itemType: 'hardware' | 'material', itemId: string, quantity: number) => Promise<void>
}) {
  const [itemType, setItemType] = useState<'hardware' | 'material'>('material')
  const [itemId, setItemId] = useState('')
  const [quantity, setQuantity] = useState('1')

  const availableItems = itemType === 'hardware' ? allHardware : allMaterials
  const selectedItem = availableItems.find(item => item.id === itemId)

  const resetForm = () => {
    setItemId('')
    setQuantity('1')
    // Keep the itemType as is, don't reset it
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemId || !quantity || parseFloat(quantity) <= 0) {
      alert('Please select an item and enter a valid quantity.')
      return
    }

    await onAdd(itemType, itemId, parseFloat(quantity))
    resetForm()
  }

  return (
    <form onSubmit={handleSubmit} className="p-2 bg-gray-50 rounded border border-gray-200">
      <div className="flex items-center gap-2">
        {/* Type Dropdown */}
        <div className="w-32">
          <select
            value={itemType}
            onChange={(e) => {
              setItemType(e.target.value as 'hardware' | 'material')
              setItemId('') // Clear item selection when type changes
            }}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
          >
            <option value="hardware">Hardware</option>
            <option value="material">Material</option>
          </select>
        </div>

        {/* Item Dropdown */}
        <div className="flex-1 min-w-0">
          <select
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
            required
          >
            <option value="">Select {itemType}...</option>
            {availableItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} {itemType === 'hardware' && (item as Hardware).supplier ? ` - ${(item as Hardware).supplier?.name}` : ''}
                {itemType === 'material' && (item as Material).supplier ? ` - ${(item as Material).supplier?.name}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Unit Cost (read-only) */}
        <div className="w-24">
          <input
            type="text"
            value={selectedItem ? `$${(selectedItem.cost_per_unit || 0).toFixed(2)}` : '$0.00'}
            readOnly
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 text-center"
            placeholder="Unit Cost"
          />
        </div>

        {/* Quantity */}
        <div className="w-24">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center"
            placeholder="Qty"
            required
          />
        </div>

        {/* Total (read-only) */}
        <div className="w-24">
          <input
            type="text"
            value={`$${((selectedItem?.cost_per_unit || 0) * (parseFloat(quantity) || 0)).toFixed(2)}`}
            readOnly
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 text-center font-medium"
            placeholder="Total"
          />
        </div>

        {/* Add Button */}
        <button
          type="submit"
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
        >
          Add
        </button>
      </div>
    </form>
  )
}

function SpecializedItemRow({
  item,
  allHardware,
  allMaterials,
  onUpdate,
  onDelete,
}: {
  item: SpecializedItem
  allHardware: Hardware[]
  allMaterials: Material[]
  onUpdate: ReturnType<typeof useUpdateSpecializedItem>
  onDelete: (id: string) => void
}) {
  const [itemType, setItemType] = useState<'hardware' | 'material'>(item.item_type)
  const [itemId, setItemId] = useState(item.item_id || '')
  const [quantity, setQuantity] = useState(item.quantity.toString())
  
  // Get the selected item to show its cost
  const selectedItem = itemType === 'hardware' 
    ? allHardware.find(h => h.id === itemId)
    : allMaterials.find(m => m.id === itemId)
  
  // Use the item's unit_cost from database, or fall back to selected item's cost_per_unit
  const unitCost = item.unit_cost || selectedItem?.cost_per_unit || 0

  // Sync state when item prop changes (but only if it's actually different)
  useEffect(() => {
    if (item.item_type !== itemType) {
      setItemType(item.item_type)
    }
    if (item.item_id !== itemId) {
      setItemId(item.item_id || '')
    }
    if (item.quantity.toString() !== quantity) {
      setQuantity(item.quantity.toString())
    }
  }, [item.item_type, item.item_id, item.quantity])

  // Update unit cost when item changes
  const handleItemChange = async (newItemId: string) => {
    if (!newItemId) return
    
    setItemId(newItemId)
    const newItem = itemType === 'hardware'
      ? allHardware.find(h => h.id === newItemId)
      : allMaterials.find(m => m.id === newItemId)
    
    const newUnitCost = newItem?.cost_per_unit || 0

    try {
      await onUpdate.mutateAsync({
        id: item.id,
        joinery_item_id: item.joinery_item_id,
        item_id: newItemId,
        unit_cost: newUnitCost,
        quantity: parseFloat(quantity) || 1,
      })
    } catch (error: any) {
      console.error('Error updating specialized item:', error)
      alert('Failed to update specialized item. Please try again.')
    }
  }

  const handleTypeChange = async (newType: 'hardware' | 'material') => {
    // Don't update if it's the same type
    if (newType === itemType) return

    setItemType(newType)
    setItemId('')

    // Select first item of new type
    const firstItem = newType === 'hardware' 
      ? allHardware[0]
      : allMaterials[0]

    if (firstItem) {
      await handleItemChange(firstItem.id)
    } else {
      // If no items available, revert the type change
      setItemType(item.item_type)
      alert(`No ${newType} items available. Please add ${newType} to the library first.`)
    }
  }

  const handleQuantityChange = async (newQuantity: string) => {
    setQuantity(newQuantity)
    const qty = parseFloat(newQuantity) || 0

    try {
      await onUpdate.mutateAsync({
        id: item.id,
        joinery_item_id: item.joinery_item_id,
        quantity: qty,
        unit_cost: unitCost,
      })
    } catch (error: any) {
      console.error('Error updating specialized item:', error)
      alert('Failed to update specialized item. Please try again.')
    }
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
      {/* Type Dropdown */}
      <div className="w-32">
        <select
          value={itemType}
          onChange={(e) => handleTypeChange(e.target.value as 'hardware' | 'material')}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="hardware">Hardware</option>
          <option value="material">Material</option>
        </select>
      </div>

      {/* Item Dropdown */}
      <div className="flex-1 min-w-0">
        <select
          value={itemId || ''}
          onChange={(e) => handleItemChange(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select...</option>
          {itemType === 'hardware' ? (
            allHardware.map((hw) => (
              <option key={hw.id} value={hw.id}>
                {hw.name} {hw.supplier ? ` - ${hw.supplier.name}` : ''}
              </option>
            ))
          ) : (
            allMaterials.map((mat) => (
              <option key={mat.id} value={mat.id}>
                {mat.name} {mat.supplier ? ` - ${mat.supplier.name}` : ''}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Unit Cost (read-only) */}
      <div className="w-24">
        <input
          type="text"
          value={`$${unitCost.toFixed(2)}`}
          readOnly
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 text-center"
        />
      </div>

      {/* Quantity */}
      <div className="w-24">
        <input
          type="number"
          min="0"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onBlur={() => handleQuantityChange(quantity)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleQuantityChange(quantity) }}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Total (read-only) */}
      <div className="w-24">
        <input
          type="text"
          value={`$${(item.total_cost || (parseFloat(quantity) || 0) * unitCost).toFixed(2)}`}
          readOnly
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 text-center font-medium"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-center">
        <button
          onClick={() => onDelete(item.id)}
          className="text-gray-400 hover:text-red-600 transition-colors"
          title="Remove"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
