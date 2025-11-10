'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Plus, Edit, Trash2, DollarSign, Package, X } from 'lucide-react'
import { useQuoteJoineryItems, useCreateQuoteJoineryItem, useUpdateQuoteJoineryItem, useDeleteQuoteJoineryItem } from '@/hooks/useQuoteJoineryItems'
import { useQuoteProject, useUpdateQuoteProject } from '@/hooks/useQuoteProjects'
import { useCabinets } from '@/hooks/useCabinets'
import { useSpecializedItems } from '@/hooks/useSpecializedItems'
import { useSettingValue } from '@/hooks/useSettings'
import { JoineryItem, Material } from '@/lib/supabase'
import { QuoteJoineryItemMaterials } from './QuoteJoineryItemMaterials'
import { QuoteJoineryItemCabinets } from './QuoteJoineryItemCabinets'
import { QuoteJoineryItemSpecializedItems } from './QuoteJoineryItemSpecializedItems'

interface QuoteJoineryItemsListProps {
  quoteId: string
  compact?: boolean
  selectedItem?: JoineryItem | null
  onSelectItem?: (item: JoineryItem | null) => void
  showForm?: boolean
  onFormClose?: () => void
  showTotal?: boolean
}

export function QuoteJoineryItemsList({ 
  quoteId, 
  compact = false,
  selectedItem,
  onSelectItem,
  showForm: showFormProp,
  onFormClose,
  showTotal = false
}: QuoteJoineryItemsListProps) {
  const [internalShowForm, setInternalShowForm] = useState(false)
  const showForm = showFormProp !== undefined ? showFormProp : internalShowForm
  const setShowForm = onFormClose ? () => onFormClose() : setInternalShowForm
  const [editingItem, setEditingItem] = useState<JoineryItem | null>(null)
  const { data: quote } = useQuoteProject(quoteId)
  const { data: items, isLoading } = useQuoteJoineryItems(quoteId)
  const safeItems = items || []
  const createItem = useCreateQuoteJoineryItem()
  const updateItem = useUpdateQuoteJoineryItem()
  const deleteItem = useDeleteQuoteJoineryItem()
  const updateQuote = useUpdateQuoteProject()
  
  // Get markup percentage from quote, default to 40 if not available
  const markupPercentage = quote?.markup_percentage?.toString() || '40'
  
  // Handle markup change - save to database
  const handleMarkupChange = useCallback(async (value: string) => {
    const numValue = parseFloat(value) || 0
    if (numValue < 0 || numValue > 1000) {
      alert('Markup percentage must be between 0 and 1000')
      return
    }
    
    try {
      await updateQuote.mutateAsync({
        id: quoteId,
        markup_percentage: numValue,
      })
    } catch (error: any) {
      console.error('Error updating markup:', error)
      alert('Failed to save markup percentage. Please try again.')
    }
  }, [quoteId, updateQuote])

  // Sort items alphabetically by joinery_number (must be called before any conditional returns)
  const sortedItems = useMemo(() => {
    if (!items) return []
    return [...items].sort((a, b) => {
      const aNum = a.joinery_number || ''
      const bNum = b.joinery_number || ''
      // Items without joinery_number go to the end
      if (!aNum && !bNum) return 0
      if (!aNum) return 1
      if (!bNum) return -1
      return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' })
    })
  }, [items])

  const FACTORY_RATE = 50 // $50/hour
  const INSTALL_RATE = 80 // $80/hour

  // Get cut and edge cost setting
  const { value: cutAndEdgeCost } = useSettingValue('cut_and_edge_cost_per_sheet', 110)

  // Calculate square meter rate for materials
  const calculateSquareMeterRate = useCallback((material: Material | null | undefined): number | null => {
    if (!material || material.material_type !== 'Board/Laminate') {
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
      // Calculate area in square meters: (length × width) / 1000000 (converting mm² to m²)
      const areaInSquareMeters = (material.length * material.width) / 1000000
      
      // Calculate square meter rate: (cost_per_unit + cut_and_edge_cost) / area_in_square_meters
      return (material.cost_per_unit + cutAndEdgeCost) / areaInSquareMeters
    }
    
    return null
  }, [cutAndEdgeCost])

  // Calculate carcass cost for a cabinet
  const calculateCarcassCost = (cabinet: any, squareMeterRate: number | null): number => {
    if (!squareMeterRate) return 0

    const cabinetWidth = cabinet.width ?? cabinet.template_cabinet?.width ?? 0
    const cabinetHeight = cabinet.height ?? cabinet.template_cabinet?.height ?? 0
    const cabinetDepth = cabinet.depth ?? cabinet.template_cabinet?.depth ?? 0

    if (cabinetWidth <= 0 || cabinetHeight <= 0 || cabinetDepth <= 0) {
      return 0
    }

    const widthM = cabinetWidth / 1000
    const heightM = cabinetHeight / 1000
    const depthM = cabinetDepth / 1000

    // Check if cabinet is tall or wall type
    const cabinetType = (cabinet.type || cabinet.template_cabinet?.type || '').toLowerCase()
    const cabinetCategory = (cabinet.category || cabinet.template_cabinet?.category || '').toLowerCase()
    const isTallOrWall = cabinetType.includes('tall') || cabinetType.includes('wall') || 
                         cabinetCategory.includes('tall') || cabinetCategory.includes('wall')

    let areaInSquareMeters: number

    if (isTallOrWall) {
      // Tall and wall carcass cost calc = carcass_sqm_rate * (width * ((2*depth)+height) + (2*depth*height))
      areaInSquareMeters = (widthM * ((2 * depthM) + heightM)) + (2 * depthM * heightM)
    } else {
      // Standard cabinet formula: (material_square_meter_rate) * ((width*(depth+height+0.1))+2*Depth*Height)
      areaInSquareMeters = (widthM * (depthM + heightM + 0.1)) + (2 * depthM * heightM)
    }

    const cost = squareMeterRate * areaInSquareMeters * cabinet.quantity

    return cost
  }

  // Calculate face cost for a cabinet
  const calculateFaceCost = (cabinet: any, faceMaterial: Material | null | undefined): number => {
    if (!faceMaterial || faceMaterial.material_type !== 'Board/Laminate') {
      return 0
    }

    const cabinetWidth = cabinet.width ?? cabinet.template_cabinet?.width ?? 0
    const cabinetHeight = cabinet.height ?? cabinet.template_cabinet?.height ?? 0

    if (cabinetWidth <= 0 || cabinetHeight <= 0) {
      return 0
    }

    const faceSquareMeterRate = calculateSquareMeterRate(faceMaterial)
    if (!faceSquareMeterRate) return 0

    const widthM = cabinetWidth / 1000
    const heightM = cabinetHeight / 1000

    const areaInSquareMeters = widthM * heightM
    const cost = faceSquareMeterRate * areaInSquareMeters * cabinet.quantity

    return cost
  }

  // Calculate total costs for all joinery items
  // This will be calculated by the QuoteTotalSummary component that has access to all cabinet data

  const handleAdd = async (joineryNumber: string, description: string, qty: number) => {
    try {
      await createItem.mutateAsync({
        quote: true, // This is a quote joinery item
        quote_proj_id: quoteId,
        joinery_number: joineryNumber || null,
        name: description, // name is required, use description as name
        description: description || null,
        qty: qty,
        factory_hours: null,
        install_hours: null,
        budget: 0,
        created_by: null, // TODO: Get from auth context when available
        install_commencement_date: null,
        install_duration: null,
        carcass_material_id: null,
        face_material_1_id: null,
        face_material_2_id: null,
        face_material_3_id: null,
        face_material_4_id: null,
        hinge_id: null,
        drawer_hardware_id: null,
        // Set all project checklist fields to false for quotes
        shop_drawings_approved: false,
        board_ordered: false,
        hardware_ordered: false,
        site_measured: false,
        microvellum_ready_to_process: false,
        processed_to_factory: false,
        picked_up_from_factory: false,
        install_scheduled: false,
        plans_printed: false,
        assembled: false,
        delivered: false,
        installed: false,
        invoiced: false,
      })
      setShowForm(false)
      onFormClose?.()
    } catch (error: any) {
      console.error('Error adding joinery item:', error)
      const errorMessage = error?.message || error?.error_description || 'Unknown error occurred'
      alert(`Failed to add joinery item: ${errorMessage}`)
    }
  }

  const handleUpdate = async (id: string, updates: Partial<JoineryItem>) => {
    try {
      await updateItem.mutateAsync({
        id,
        quote_proj_id: quoteId,
        ...updates,
      })
      setEditingItem(null)
      setShowForm(false)
    } catch (error: any) {
      console.error('Error updating joinery item:', error)
      const errorMessage = error?.message || error?.error_description || 'Unknown error occurred'
      alert(`Failed to update joinery item: ${errorMessage}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this joinery item?')) return
    
    try {
      await deleteItem.mutateAsync({ id, quote_proj_id: quoteId })
    } catch (error: any) {
      console.error('Error deleting joinery item:', error)
      const errorMessage = error?.message || error?.error_description || 'Unknown error occurred'
      alert(`Failed to delete joinery item: ${errorMessage}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Compact view for left column
  if (compact) {
    return (
      <div className="p-2">
        {sortedItems && sortedItems.length > 0 ? (
          <div className="space-y-1">
            {sortedItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectItem?.(item)
                }}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedItem?.id === item.id
                    ? 'bg-blue-100 text-blue-900 font-medium'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {item.joinery_number || 'No Number'}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">
            No joinery items
          </div>
        )}
      </div>
    )
  }

  // Detail view for middle column - show selected item or form
  if (showForm || editingItem) {
    return (
      <div className="p-6">
        <QuoteJoineryItemForm
          item={editingItem || undefined}
          onAdd={handleAdd}
          onUpdate={editingItem ? (updates) => handleUpdate(editingItem.id, updates) : undefined}
          onClose={() => {
            setShowForm(false)
            onFormClose?.()
            setEditingItem(null)
          }}
        />
      </div>
    )
  }

  if (selectedItem) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            {selectedItem.description && (
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedItem.description}</p>
            )}
            {selectedItem.joinery_number && (
              <p className="text-xs text-gray-500 mt-1">#{selectedItem.joinery_number}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditingItem(selectedItem)}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => handleDelete(selectedItem.id)}
              className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        <QuoteJoineryItemCard
          item={selectedItem}
          quoteId={quoteId}
          onEdit={setEditingItem}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </div>
    )
  }

  // Show quote total in right panel
  if (showTotal) {
    return (
      <div className="p-4">
        {items && items.length > 0 ? (
          <QuoteTotalSummary
            items={items}
            markupPercentage={markupPercentage}
            onMarkupChange={handleMarkupChange}
            factoryRate={FACTORY_RATE}
            installRate={INSTALL_RATE}
            calculateSquareMeterRate={calculateSquareMeterRate}
            calculateCarcassCost={calculateCarcassCost}
            calculateFaceCost={calculateFaceCost}
          />
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">Add joinery items to see quote total</p>
          </div>
        )}
      </div>
    )
  }

  // Show empty state when no item selected and no form
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-500">
        <p className="text-lg font-medium mb-2">Select a joinery item</p>
        <p className="text-sm">Click on a joinery item from the left panel to view details, or click "+ Add Item" to create a new one</p>
      </div>
    </div>
  )

  // Default view (shouldn't be shown in new layout, but keeping for backward compatibility)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Joinery Items</h3>
          <p className="text-sm text-gray-600">Add joinery items with materials, cabinets, and hardware</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Items List */}
      {safeItems.length > 0 ? (
        <div className="space-y-4">
          {safeItems.map((item: JoineryItem) => (
            <QuoteJoineryItemCard
              key={item.id}
              item={item}
              quoteId={quoteId}
              onEdit={setEditingItem}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border rounded-lg">
          <div className="text-gray-400 mb-4">
            <Package className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No joinery items yet</h3>
          <p className="text-gray-500 mb-4">Add your first joinery item to get started.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add First Item</span>
          </button>
        </div>
      )}


      {/* Quote Total Summary */}
      {safeItems.length > 0 && (
        <QuoteTotalSummary
          items={safeItems}
          markupPercentage={markupPercentage}
          onMarkupChange={handleMarkupChange}
          factoryRate={FACTORY_RATE}
          installRate={INSTALL_RATE}
          calculateSquareMeterRate={calculateSquareMeterRate}
          calculateCarcassCost={calculateCarcassCost}
          calculateFaceCost={calculateFaceCost}
        />
      )}
    </div>
  )
}

function QuoteTotalSummary({
  items,
  markupPercentage,
  onMarkupChange,
  factoryRate,
  installRate,
  calculateSquareMeterRate,
  calculateCarcassCost,
  calculateFaceCost,
}: {
  items: JoineryItem[]
  markupPercentage: string
  onMarkupChange: (value: string) => Promise<void>
  factoryRate: number
  installRate: number
  calculateSquareMeterRate: (material: Material | null | undefined) => number | null
  calculateCarcassCost: (cabinet: any, squareMeterRate: number | null) => number
  calculateFaceCost: (cabinet: any, faceMaterial: Material | null | undefined) => number
}) {
  const [localMarkup, setLocalMarkup] = useState(markupPercentage)
  
  // Sync local state when prop changes
  useEffect(() => {
    setLocalMarkup(markupPercentage)
  }, [markupPercentage])
  
  // Handle blur to save to database
  const handleMarkupBlur = () => {
    if (localMarkup !== markupPercentage) {
      onMarkupChange(localMarkup)
    }
  }
  
  // Handle Enter key to save
  const handleMarkupKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.currentTarget as HTMLInputElement).blur()
    }
  }
  // Calculate hours cost
  const totalHoursCost = useMemo(() => {
    return items.reduce((sum, item) => {
      const factoryCost = (item.factory_hours || 0) * factoryRate
      const installCost = (item.install_hours || 0) * installRate
      return sum + factoryCost + installCost
    }, 0)
  }, [items, factoryRate, installRate])

  // Get cabinet costs from all items
  const [itemCabinetCosts, setItemCabinetCosts] = useState<Record<string, number>>({})
  
  // Get specialized items costs from all items
  const [itemSpecializedCosts, setItemSpecializedCosts] = useState<Record<string, number>>({})
  
  const totalCabinetCost = useMemo(() => {
    return Object.values(itemCabinetCosts).reduce((sum, cost) => sum + cost, 0)
  }, [itemCabinetCosts])

  const totalSpecializedCost = useMemo(() => {
    return Object.values(itemSpecializedCosts).reduce((sum, cost) => sum + cost, 0)
  }, [itemSpecializedCosts])

  const handleItemCostChange = useCallback((itemId: string, cost: number) => {
    setItemCabinetCosts(prev => {
      // Only update if the cost actually changed
      if (prev[itemId] === cost) return prev
      return { ...prev, [itemId]: cost }
    })
  }, [])

  const handleSpecializedCostChange = useCallback((itemId: string, cost: number) => {
    setItemSpecializedCosts(prev => {
      // Only update if the cost actually changed
      if (prev[itemId] === cost) return prev
      return { ...prev, [itemId]: cost }
    })
  }, [])

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Total</h3>
        
        <div className="space-y-3">
          {/* Hidden components to calculate cabinet costs */}
          {items.map(item => (
            <ItemCabinetCosts
              key={item.id}
              item={item}
              calculateSquareMeterRate={calculateSquareMeterRate}
              calculateCarcassCost={calculateCarcassCost}
              calculateFaceCost={calculateFaceCost}
              onCostChange={(cost) => handleItemCostChange(item.id, cost)}
            />
          ))}

          {/* Hidden components to calculate specialized items costs */}
          {items.map(item => (
            <ItemSpecializedCosts
              key={`specialized-${item.id}`}
              item={item}
              onCostChange={(cost) => handleSpecializedCostChange(item.id, cost)}
            />
          ))}

          {/* Cabinet Costs Display */}
          {totalCabinetCost > 0 && (
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">Cabinet Costs:</span>
              <span className="text-sm font-medium text-gray-900">${totalCabinetCost.toFixed(2)}</span>
            </div>
          )}

          {/* Specialized Items Costs Display */}
          {totalSpecializedCost > 0 && (
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">Specialized Items:</span>
              <span className="text-sm font-medium text-gray-900">${totalSpecializedCost.toFixed(2)}</span>
            </div>
          )}

          {/* Hours Costs */}
          {totalHoursCost > 0 && (
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">Factory & Install Hours:</span>
              <span className="text-sm font-medium text-gray-900">${totalHoursCost.toFixed(2)}</span>
            </div>
          )}

          {/* Subtotal */}
          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Subtotal:</span>
            <span className="text-sm font-semibold text-gray-900">${(totalCabinetCost + totalSpecializedCost + totalHoursCost).toFixed(2)}</span>
          </div>

          {/* Markup Input */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
              <label htmlFor="markup" className="text-sm font-medium text-gray-700">
                Markup (%):
              </label>
              <input
                type="number"
                id="markup"
                min="0"
                max="1000"
                step="0.1"
                value={localMarkup}
                onChange={(e) => setLocalMarkup(e.target.value)}
                onBlur={handleMarkupBlur}
                onKeyDown={handleMarkupKeyDown}
                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="40"
              />
            </div>
            {((totalCabinetCost + totalSpecializedCost + totalHoursCost) * (parseFloat(localMarkup) || 0) / 100) > 0 && (
              <span className="text-sm font-medium text-gray-900">
                ${((totalCabinetCost + totalSpecializedCost + totalHoursCost) * (parseFloat(localMarkup) || 0) / 100).toFixed(2)}
              </span>
            )}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-3 border-t-2 border-gray-400">
            <span className="text-lg font-semibold text-gray-900">Total:</span>
            <span className="text-2xl font-bold text-gray-900">
              ${((totalCabinetCost + totalSpecializedCost + totalHoursCost) * (1 + (parseFloat(localMarkup) || 0) / 100)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ItemCabinetCosts({
  item,
  calculateSquareMeterRate,
  calculateCarcassCost,
  calculateFaceCost,
  onCostChange,
}: {
  item: JoineryItem
  calculateSquareMeterRate: (material: Material | null | undefined) => number | null
  calculateCarcassCost: (cabinet: any, squareMeterRate: number | null) => number
  calculateFaceCost: (cabinet: any, faceMaterial: Material | null | undefined) => number
  onCostChange: (cost: number) => void
}) {
  const { data: cabinets } = useCabinets(item.id)
  
  // Calculate number of hinges per cabinet based on type, category, and height
  const calculateHingesPerCabinet = (cabinet: any): number => {
    const cabinetType = (cabinet.type || cabinet.template_cabinet?.type || '').toLowerCase()
    const cabinetCategory = (cabinet.category || cabinet.template_cabinet?.category || '').toLowerCase()
    const cabinetHeight = cabinet.height ?? cabinet.template_cabinet?.height ?? 0

    // Extract door count from type (e.g., "door_1" = 1, "door_2" = 2)
    const doorMatch = cabinetType.match(/door[_\s]*(\d+)/)
    const doorCount = doorMatch ? parseInt(doorMatch[1]) : 0

    // If no doors, return 0 hinges
    if (doorCount === 0) return 0

    // Check if it's a tall cabinet
    const isTall = cabinetCategory.includes('tall') || cabinetType.includes('tall')

    let hingesPerDoor: number

    if (isTall) {
      // Tall cabinets: 5 hinges per door regardless of height
      hingesPerDoor = 5
    } else {
      // Base/Wall cabinets: ≤900mm = 2 hinges per door, >900mm = 3 hinges per door
      hingesPerDoor = cabinetHeight <= 900 ? 2 : 3
    }

    return hingesPerDoor * doorCount
  }

  // Calculate hinge cost for a cabinet
  const calculateHingeCost = (cabinet: any): number => {
    if (!item.hinge || !item.hinge.cost_per_unit) {
      return 0
    }

    const hingesPerCabinet = calculateHingesPerCabinet(cabinet)
    const totalHinges = (hingesPerCabinet + (cabinet.extra_hinges || 0)) * cabinet.quantity
    if (totalHinges === 0) return 0

    const costPerHinge = item.hinge.cost_per_unit
    const totalCost = costPerHinge * totalHinges

    return totalCost
  }

  // Calculate number of drawer hardware per cabinet based on type
  const calculateDrawerHardwarePerCabinet = (cabinet: any): number => {
    const cabinetType = (cabinet.type || cabinet.template_cabinet?.type || '').toLowerCase()

    // Extract drawer count from type (e.g., "drawer_1" = 1, "drawer_2" = 2)
    const drawerMatch = cabinetType.match(/drawer[_\s]*(\d+)/)
    const drawerCount = drawerMatch ? parseInt(drawerMatch[1]) : 0

    return drawerCount
  }

  // Calculate drawer hardware cost for a cabinet
  const calculateDrawerHardwareCost = (cabinet: any): number => {
    if (!item.drawer_hardware || !item.drawer_hardware.cost_per_unit) {
      return 0
    }

    const drawerHardwarePerCabinet = calculateDrawerHardwarePerCabinet(cabinet)
    const totalDrawerHardware = (drawerHardwarePerCabinet + (cabinet.extra_drawers || 0)) * cabinet.quantity
    if (totalDrawerHardware === 0) return 0

    const costPerDrawerHardware = item.drawer_hardware.cost_per_unit
    const totalCost = costPerDrawerHardware * totalDrawerHardware

    return totalCost
  }
  
  const itemCabinetCost = useMemo(() => {
    if (!cabinets || cabinets.length === 0) return 0

    const carcassSquareMeterRate = calculateSquareMeterRate(item.carcass_material)
    let total = 0
    
    cabinets.forEach(cabinet => {
      const carcassCost = calculateCarcassCost(cabinet, carcassSquareMeterRate)
      
      const faceMaterial = cabinet.assigned_face_material === 1 ? item.face_material_1 :
                          cabinet.assigned_face_material === 2 ? item.face_material_2 :
                          cabinet.assigned_face_material === 3 ? item.face_material_3 :
                          cabinet.assigned_face_material === 4 ? item.face_material_4 : null
      
      const faceCost = calculateFaceCost(cabinet, faceMaterial)
      const hingeCost = calculateHingeCost(cabinet)
      const drawerHardwareCost = calculateDrawerHardwareCost(cabinet)
      
      total += carcassCost + faceCost + hingeCost + drawerHardwareCost
    })

    return total
  }, [cabinets, item, item.hinge, item.drawer_hardware, calculateSquareMeterRate, calculateCarcassCost, calculateFaceCost])

  const prevCostRef = useRef<number>(0)
  const onCostChangeRef = useRef(onCostChange)
  
  // Update ref when callback changes
  useEffect(() => {
    onCostChangeRef.current = onCostChange
  }, [onCostChange])
  
  useEffect(() => {
    // Only call onCostChange if the cost actually changed
    if (itemCabinetCost !== prevCostRef.current) {
      prevCostRef.current = itemCabinetCost
      onCostChangeRef.current(itemCabinetCost)
    }
  }, [itemCabinetCost])

  return null // This component doesn't render anything, it just calculates costs
}

function ItemSpecializedCosts({
  item,
  onCostChange,
}: {
  item: JoineryItem
  onCostChange: (cost: number) => void
}) {
  const { data: specializedItems } = useSpecializedItems(item.id)
  
  const itemSpecializedCost = useMemo(() => {
    if (!specializedItems || specializedItems.length === 0) return 0
    return specializedItems.reduce((sum, item) => sum + (item.total_cost || 0), 0)
  }, [specializedItems])

  const prevCostRef = useRef<number>(0)
  const onCostChangeRef = useRef(onCostChange)
  
  // Update ref when callback changes
  useEffect(() => {
    onCostChangeRef.current = onCostChange
  }, [onCostChange])
  
  useEffect(() => {
    // Only call onCostChange if the cost actually changed
    if (itemSpecializedCost !== prevCostRef.current) {
      prevCostRef.current = itemSpecializedCost
      onCostChangeRef.current(itemSpecializedCost)
    }
  }, [itemSpecializedCost])

  return null // This component doesn't render anything, it just calculates costs
}

function QuoteJoineryItemCard({
  item,
  quoteId,
  onEdit,
  onUpdate,
  onDelete,
}: {
  item: JoineryItem
  quoteId: string
  onEdit: (item: JoineryItem) => void
  onUpdate: (id: string, updates: Partial<JoineryItem>) => void
  onDelete: (id: string) => void
}) {
  const FACTORY_RATE = 50 // $50/hour
  const INSTALL_RATE = 80 // $80/hour
  
  const [factoryHours, setFactoryHours] = useState(item.factory_hours?.toString() || '0')
  const [installHours, setInstallHours] = useState(item.install_hours?.toString() || '0')
  
  // Update local state when item changes
  useEffect(() => {
    setFactoryHours(item.factory_hours?.toString() || '0')
    setInstallHours(item.install_hours?.toString() || '0')
  }, [item.factory_hours, item.install_hours])
  
  const factoryCost = (parseFloat(factoryHours) || 0) * FACTORY_RATE
  const installCost = (parseFloat(installHours) || 0) * INSTALL_RATE
  const totalHoursCost = factoryCost + installCost

  const handleFactoryHoursBlur = () => {
    const value = parseFloat(factoryHours) || 0
    onUpdate(item.id, { factory_hours: value })
  }

  const handleInstallHoursBlur = () => {
    const value = parseFloat(installHours) || 0
    onUpdate(item.id, { install_hours: value })
  }

  const handleFactoryHoursKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.currentTarget as HTMLInputElement).blur()
    }
  }

  const handleInstallHoursKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.currentTarget as HTMLInputElement).blur()
    }
  }

  return (
    <div className="space-y-6">
        <QuoteJoineryItemMaterials joineryItem={item} />

          {/* Cabinets Section */}
          <div className="pt-4 border-t-4 border-gray-400">
            <QuoteJoineryItemCabinets 
              joineryItem={item}
            />
          </div>

        {/* Specialized Hardware/Materials Section */}
        <div className="pt-4 border-t-4 border-gray-400">
          <QuoteJoineryItemSpecializedItems joineryItem={item} />
        </div>

        {/* Hours Estimate Section */}
        <div className="pt-4 border-t-4 border-gray-400">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Hours Estimate</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded border">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Factory Hours
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={factoryHours}
                onChange={(e) => setFactoryHours(e.target.value)}
                onBlur={handleFactoryHoursBlur}
                onKeyDown={handleFactoryHoursKeyDown}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cost: ${factoryCost.toFixed(2)} @ ${FACTORY_RATE}/hr
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded border">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Install Hours
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={installHours}
                onChange={(e) => setInstallHours(e.target.value)}
                onBlur={handleInstallHoursBlur}
                onKeyDown={handleInstallHoursKeyDown}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cost: ${installCost.toFixed(2)} @ ${INSTALL_RATE}/hr
              </p>
            </div>
          </div>
          {totalHoursCost > 0 && (
            <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Hours Cost:</span>
                <span className="text-sm font-semibold text-blue-900">
                  ${totalHoursCost.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
    </div>
  )
}

function QuoteJoineryItemForm({
  item,
  onAdd,
  onUpdate,
  onClose,
}: {
  item?: JoineryItem
  onAdd: (joineryNumber: string, description: string, qty: number) => void
  onUpdate?: (updates: Partial<JoineryItem>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    joinery_number: item?.joinery_number || '',
    description: item?.name || item?.description || '', // Use name if available, fallback to description
    qty: item?.qty || 1,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!formData.description.trim()) {
      setErrors({ description: 'Description is required' })
      return
    }

    if (item && onUpdate) {
      onUpdate({
        joinery_number: formData.joinery_number.trim() || null,
        name: formData.description.trim(), // name is required
        description: formData.description.trim() || null,
        qty: formData.qty,
      })
    } else {
      onAdd(
        formData.joinery_number.trim() || '',
        formData.description.trim(),
        formData.qty
      )
    }
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">
        {item ? 'Edit Joinery Item' : 'Add Joinery Item'}
      </h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="joinery_number" className="block text-sm font-medium text-gray-700 mb-1">
            Joinery Number
          </label>
          <input
            type="text"
            id="joinery_number"
            value={formData.joinery_number}
            onChange={(e) => setFormData(prev => ({ ...prev, joinery_number: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., J-001"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Description of the joinery item"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="qty" className="block text-sm font-medium text-gray-700 mb-1">
            Quantity *
          </label>
          <input
            type="number"
            id="qty"
            min="1"
            value={formData.qty}
            onChange={(e) => setFormData(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {item ? 'Update' : 'Add'} Item
          </button>
        </div>
      </form>
    </div>
  )
}

