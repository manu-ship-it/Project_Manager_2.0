'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Plus, Edit, Trash2, DollarSign, Package, X } from 'lucide-react'
import { useQuoteJoineryItems, useCreateQuoteJoineryItem, useUpdateQuoteJoineryItem, useDeleteQuoteJoineryItem } from '@/hooks/useQuoteJoineryItems'
import { useQuoteProject, useUpdateQuoteProject } from '@/hooks/useQuoteProjects'
import { useCabinets } from '@/hooks/useCabinets'
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
  
  // Calculate totals from pre-calculated database values
  // TODO: Debug - check if database values are being populated correctly
  const totalCabinetCost = useMemo(() => {
    const dbSum = safeItems.reduce((sum, item) => sum + (item.calculated_cabinet_cost || 0), 0)
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Database calculated_cabinet_cost values:', safeItems.map(item => ({
        id: item.id,
        name: item.name,
        calculated_cabinet_cost: item.calculated_cabinet_cost
      })))
      console.log('Total cabinet cost from DB:', dbSum)
    }
    return dbSum
  }, [safeItems])
  
  const totalSpecializedCost = useMemo(() => {
    return safeItems.reduce((sum, item) => sum + (item.calculated_specialized_cost || 0), 0)
  }, [safeItems])
  
  const totalHoursCost = useMemo(() => {
    return safeItems.reduce((sum, item) => sum + (item.calculated_hours_cost || 0), 0)
  }, [safeItems])
  
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

  // Note: All cost calculations are now done in the database via triggers
  // We just read the pre-calculated values from joinery_item and quote_project

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
    // Calculate total cost for each item (with markup) using pre-calculated values
    const calculateItemTotal = (item: JoineryItem): number => {
      const subtotal = item.calculated_total_cost || 0
      const markupMultiplier = 1 + (parseFloat(markupPercentage) || 0) / 100
      return subtotal * markupMultiplier
    }

    return (
      <div className="p-2">
        
        {sortedItems && sortedItems.length > 0 ? (
          <div className="space-y-1">
            {sortedItems.map((item) => {
              const itemTotal = calculateItemTotal(item)
              return (
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
                  <div className="flex items-center justify-between">
                    <span className="truncate">{item.joinery_number || 'No Number'}</span>
                    {itemTotal > 0 && (
                      <span className="ml-2 text-xs font-semibold text-gray-900 whitespace-nowrap">
                        ${itemTotal.toFixed(2)}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
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
        {/* Costs are now calculated in database via triggers */}

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
          onCabinetCostChange={undefined} // Costs are now calculated in database
        />
      </div>
    )
  }

  // Show quote total in right panel
  if (showTotal) {
    return (
      <div className="p-4">
        {/* Costs are now calculated in database via triggers */}
        {items && items.length > 0 ? (
          <QuoteTotalSummary
            quoteId={quoteId}
            items={items}
            markupPercentage={markupPercentage}
            onMarkupChange={handleMarkupChange}
            totalCabinetCost={totalCabinetCost}
            totalSpecializedCost={totalSpecializedCost}
            totalHoursCost={totalHoursCost}
            updateQuote={updateQuote}
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
              onCabinetCostChange={undefined} // Costs are now calculated in database
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
          quoteId={quoteId}
          items={safeItems}
          markupPercentage={markupPercentage}
          onMarkupChange={handleMarkupChange}
          totalCabinetCost={totalCabinetCost}
          totalSpecializedCost={totalSpecializedCost}
          totalHoursCost={totalHoursCost}
          updateQuote={updateQuote}
        />
      )}
    </div>
  )
}

function QuoteTotalSummary({
  quoteId,
  items,
  markupPercentage,
  onMarkupChange,
  totalCabinetCost,
  totalSpecializedCost,
  totalHoursCost,
  updateQuote,
}: {
  quoteId: string
  items: JoineryItem[]
  markupPercentage: string
  onMarkupChange: (value: string) => Promise<void>
  totalCabinetCost: number
  totalSpecializedCost: number
  totalHoursCost: number
  updateQuote: ReturnType<typeof useUpdateQuoteProject>
}) {
  const { data: quote } = useQuoteProject(quoteId)
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

  // Use pre-calculated total from database (triggers will update it automatically)
  const calculatedTotal = quote?.total_amount || 0
  const subtotal = totalCabinetCost + totalSpecializedCost + totalHoursCost

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Total</h3>
        
        <div className="space-y-3">
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
            <span className="text-sm font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
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
            {(subtotal * (parseFloat(localMarkup) || 0) / 100) > 0 && (
              <span className="text-sm font-medium text-gray-900">
                ${(subtotal * (parseFloat(localMarkup) || 0) / 100).toFixed(2)}
              </span>
            )}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-3 border-t-2 border-gray-400">
            <span className="text-lg font-semibold text-gray-900">Total:</span>
            <span className="text-2xl font-bold text-gray-900">
              ${calculatedTotal.toFixed(2)}
            </span>
          </div>
          
          {/* Note about automatic calculation */}
          <p className="text-xs text-gray-500 mt-2 italic">
            * Totals are automatically calculated by the database when items change
          </p>
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
  
  // Evaluate area calculation formula (e.g., "(2 * depth * height) + (width * height) + ((1.1+shelf_qty) * width * depth)")
  // Dimensions are in mm, formula result is in mm², we convert to m² at the end
  const evaluateAreaFormula = (
    formula: string | null | undefined,
    width: number,
    height: number,
    depth: number,
    shelfQty: number,
    drawerQty: number,
    doorQty: number,
    endPanelsQty: number
  ): number => {
    if (!formula || formula.trim() === '0' || formula.trim() === '') {
      return 0
    }
    
    // Replace variables with actual values (all in mm)
    let expression = formula
      .replace(/width/g, width.toString())
      .replace(/height/g, height.toString())
      .replace(/depth/g, depth.toString())
      .replace(/shelf_qty/g, shelfQty.toString())
      .replace(/drawer_qty/g, drawerQty.toString())
      .replace(/door_qty/g, doorQty.toString())
      .replace(/end_panels_qty/g, endPanelsQty.toString())
    
    // Evaluate the expression safely
    try {
      // Use Function constructor for safe evaluation
      const result = new Function('return ' + expression)()
      // Convert from mm² to m² (divide by 1,000,000)
      return result / 1000000
    } catch (error) {
      console.error('Error evaluating area formula:', formula, error)
      return 0
    }
  }

  // Calculate carcass cost for a cabinet (with template formula support)
  const calculateCarcassCostWithFormula = (cabinet: any, squareMeterRate: number | null): number => {
    if (!squareMeterRate) return 0

    const cabinetWidth = cabinet.width ?? cabinet.template_cabinet?.width ?? 0
    const cabinetHeight = cabinet.height ?? cabinet.template_cabinet?.height ?? 0
    const cabinetDepth = cabinet.depth ?? cabinet.template_cabinet?.depth ?? 0

    if (cabinetWidth <= 0 || cabinetHeight <= 0 || cabinetDepth <= 0) {
      return 0
    }

    const shelfQty = cabinet.shelf_qty ?? cabinet.template_cabinet?.shelf_qty ?? 0
    const drawerQty = cabinet.drawer_qty ?? cabinet.template_cabinet?.drawer_qty ?? 0
    const doorQty = cabinet.door_qty ?? cabinet.template_cabinet?.door_qty ?? 0
    const endPanelsQty = cabinet.end_panels_qty ?? cabinet.template_cabinet?.end_panels_qty ?? 0

    // Get carcass calculation formula from template
    const carcassFormula = cabinet.template_cabinet?.carcass_calculation

    let areaInSquareMeters: number

    if (carcassFormula) {
      // Use template formula (dimensions in mm, formula evaluates to mm², we convert to m²)
      areaInSquareMeters = evaluateAreaFormula(
        carcassFormula,
        cabinetWidth,
        cabinetHeight,
        cabinetDepth,
        shelfQty,
        drawerQty,
        doorQty,
        endPanelsQty
      )
    } else {
      // Fallback to passed calculateCarcassCost function
      return calculateCarcassCost(cabinet, squareMeterRate)
    }

    const cost = squareMeterRate * areaInSquareMeters * cabinet.quantity

    return cost
  }

  // Calculate face material cost for a cabinet (with template formula support)
  const calculateFaceCostWithFormula = (cabinet: any, faceMaterial: Material | null | undefined): number => {
    if (!faceMaterial || faceMaterial.material_type !== 'Board/Laminate') {
      return 0
    }

    const cabinetWidth = cabinet.width ?? cabinet.template_cabinet?.width ?? 0
    const cabinetHeight = cabinet.height ?? cabinet.template_cabinet?.height ?? 0
    const cabinetDepth = cabinet.depth ?? cabinet.template_cabinet?.depth ?? 0

    if (cabinetWidth <= 0 || cabinetHeight <= 0) {
      return 0
    }

    // Calculate square meter rate for face material
    const faceSquareMeterRate = calculateSquareMeterRate(faceMaterial)
    if (!faceSquareMeterRate) return 0

    const shelfQty = cabinet.shelf_qty ?? cabinet.template_cabinet?.shelf_qty ?? 0
    const drawerQty = cabinet.drawer_qty ?? cabinet.template_cabinet?.drawer_qty ?? 0
    const doorQty = cabinet.door_qty ?? cabinet.template_cabinet?.door_qty ?? 0
    const endPanelsQty = cabinet.end_panels_qty ?? cabinet.template_cabinet?.end_panels_qty ?? 0

    // Get face calculation formula from template
    const faceFormula = cabinet.template_cabinet?.face_calculation

    let areaInSquareMeters: number

    if (faceFormula) {
      // Use template formula (dimensions in mm, formula evaluates to mm², we convert to m²)
      areaInSquareMeters = evaluateAreaFormula(
        faceFormula,
        cabinetWidth,
        cabinetHeight,
        cabinetDepth,
        shelfQty,
        drawerQty,
        doorQty,
        endPanelsQty
      )
    } else {
      // Fallback to passed calculateFaceCost function
      return calculateFaceCost(cabinet, faceMaterial)
    }

    const faceCost = faceSquareMeterRate * areaInSquareMeters * cabinet.quantity

    return faceCost
  }

  // Evaluate formula string (e.g., "door_qty*2" or "drawer_qty*1")
  const evaluateFormula = (formula: string | null | undefined, doorQty: number, drawerQty: number): number => {
    if (!formula) return 0
    
    // If it's just a number, return it
    if (/^\d+$/.test(formula.trim())) {
      return parseInt(formula.trim())
    }
    
    // Replace variables with actual values
    let expression = formula
      .replace(/door_qty/g, doorQty.toString())
      .replace(/drawer_qty/g, drawerQty.toString())
    
    // Evaluate the expression safely
    try {
      // Use Function constructor for safe evaluation
      const result = new Function('return ' + expression)()
      return Math.round(result) || 0
    } catch (error) {
      console.error('Error evaluating formula:', formula, error)
      return 0
    }
  }

  // Calculate number of hinges per cabinet (using formula from template)
  const calculateHingesPerCabinet = (cabinet: any): number => {
    const doorQty = cabinet.door_qty ?? cabinet.template_cabinet?.door_qty ?? 0
    const drawerQty = cabinet.drawer_qty ?? cabinet.template_cabinet?.drawer_qty ?? 0
    
    // Try to use hinge_qty formula from cabinet or template
    const hingeQtyFormula = cabinet.hinge_qty || cabinet.template_cabinet?.hinge_qty
    
    if (hingeQtyFormula) {
      return evaluateFormula(hingeQtyFormula, doorQty, drawerQty)
    }
    
    // Fallback: if no formula, return 0 (no automatic calculation)
    return 0
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

  // Calculate number of drawer hardware per cabinet (using formula from template)
  const calculateDrawerHardwarePerCabinet = (cabinet: any): number => {
    const drawerQty = cabinet.drawer_qty ?? cabinet.template_cabinet?.drawer_qty ?? 0
    
    // Try to use drawer_hardware_qty formula from cabinet or template
    const drawerHardwareQtyFormula = cabinet.drawer_hardware_qty || cabinet.template_cabinet?.drawer_hardware_qty
    
    if (drawerHardwareQtyFormula) {
      return evaluateFormula(drawerHardwareQtyFormula, 0, drawerQty)
    }
    
    // Fallback: if no formula but drawer_qty exists, use 1:1 ratio
    return drawerQty
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
      const carcassCost = calculateCarcassCostWithFormula(cabinet, carcassSquareMeterRate)
      
      const faceMaterial = cabinet.assigned_face_material === 1 ? item.face_material_1 :
                          cabinet.assigned_face_material === 2 ? item.face_material_2 :
                          cabinet.assigned_face_material === 3 ? item.face_material_3 :
                          cabinet.assigned_face_material === 4 ? item.face_material_4 : null
      
      const faceCost = calculateFaceCostWithFormula(cabinet, faceMaterial)
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

// ItemSpecializedCosts component removed - costs are now calculated in database

function QuoteJoineryItemCard({
  item,
  quoteId,
  onEdit,
  onUpdate,
  onDelete,
  onCabinetCostChange,
}: {
  item: JoineryItem
  quoteId: string
  onEdit: (item: JoineryItem) => void
  onUpdate: (id: string, updates: Partial<JoineryItem>) => void
  onDelete: (id: string) => void
  onCabinetCostChange?: (itemId: string, cost: number) => void
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
              onTotalCostChange={() => {}} // Costs are now calculated in database
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

