'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Plus, X, Edit, Trash2, Box, Hash, Ruler, CheckSquare, Square, DollarSign, ChevronDown, ChevronRight, Copy } from 'lucide-react'
import { useCabinets, useCreateCabinet, useUpdateCabinet, useDeleteCabinet } from '@/hooks/useCabinets'
import { useTemplateCabinets } from '@/hooks/useTemplateCabinets'
import { useSettingValue } from '@/hooks/useSettings'
import { Cabinet, JoineryItem, Material } from '@/lib/supabase'

interface QuoteJoineryItemCabinetsProps {
  joineryItem: JoineryItem
  onTotalCostChange?: (totalCost: number) => void
}

export function QuoteJoineryItemCabinets({ joineryItem, onTotalCostChange }: QuoteJoineryItemCabinetsProps) {
  const [editingCabinet, setEditingCabinet] = useState<Cabinet | null>(null)
  const [selectedCabinets, setSelectedCabinets] = useState<Set<string>>(new Set())
  const [bulkFaceMaterial, setBulkFaceMaterial] = useState<1 | 2 | 3 | 4 | ''>('')
  const { data: cabinets, isLoading: cabinetsLoading } = useCabinets(joineryItem.id)
  const { data: allCabinets } = useTemplateCabinets()
  const addCabinet = useCreateCabinet()
  const updateCabinet = useUpdateCabinet()
  const removeCabinet = useDeleteCabinet()

  // All cabinets are available (can add same cabinet multiple times)
  const availableCabinets = allCabinets || []

  // Get available face materials from joinery item
  const availableFaceMaterials = [
    { number: 1 as const, material: joineryItem.face_material_1, materialId: joineryItem.face_material_1_id },
    { number: 2 as const, material: joineryItem.face_material_2, materialId: joineryItem.face_material_2_id },
    { number: 3 as const, material: joineryItem.face_material_3, materialId: joineryItem.face_material_3_id },
    { number: 4 as const, material: joineryItem.face_material_4, materialId: joineryItem.face_material_4_id },
  ].filter(fm => fm.materialId !== null)

  const handleAdd = async (
    cabinetId: string, 
    quantity: number, 
    customDimensions?: { width?: number; height?: number; depth?: number },
    doorQty?: number,
    drawerQty?: number,
    shelfQty?: number,
    onReset?: () => void
  ) => {
    try {
      // Get the template cabinet to copy default values
      const templateCabinet = allCabinets?.find(c => c.id === cabinetId)
      
      await addCabinet.mutateAsync({
        joinery_item_id: joineryItem.id,
        template_id: cabinetId,
        quantity,
        type: templateCabinet?.type || null,
        category: templateCabinet?.category || null,
        name: templateCabinet?.name || null,
        width: customDimensions?.width || templateCabinet?.width || null,
        height: customDimensions?.height || templateCabinet?.height || null,
        depth: customDimensions?.depth || templateCabinet?.depth || null,
        quote: true, // This is a quote cabinet
        assigned_face_material: templateCabinet?.assigned_face_material ?? 1, // Default to 1 if template doesn't have it
        extra_hinges: 0,
        extra_drawers: 0,
        end_panels_qty: templateCabinet?.end_panels_qty || 0,
        door_qty: doorQty !== undefined ? doorQty : (templateCabinet?.door_qty ?? 0),
        drawer_qty: drawerQty !== undefined ? drawerQty : (templateCabinet?.drawer_qty ?? 0),
        shelf_qty: shelfQty !== undefined ? shelfQty : (templateCabinet?.shelf_qty ?? 0),
        hinge_qty: templateCabinet?.hinge_qty || null,
        drawer_hardware_qty: templateCabinet?.drawer_hardware_qty || null,
        created_by: null, // TODO: Get from auth context when available
      })
      // Reset the form after successful add
      onReset?.()
    } catch (error: any) {
      console.error('Error adding cabinet:', error)
      const errorMessage = error?.message || error?.error_description || 'Unknown error occurred'
      alert(`Failed to add cabinet: ${errorMessage}`)
    }
  }

  const handleUpdate = async (id: string, updates: Partial<Cabinet>) => {
    try {
      await updateCabinet.mutateAsync({
        id,
        ...updates,
      })
      setEditingCabinet(null)
    } catch (error: any) {
      console.error('Error updating cabinet:', error)
      alert('Failed to update cabinet. Please try again.')
    }
  }

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this cabinet?')) return
    
    try {
      await removeCabinet.mutateAsync({ id, joinery_item_id: joineryItem.id })
    } catch (error: any) {
      console.error('Error removing cabinet:', error)
      alert('Failed to remove cabinet. Please try again.')
    }
  }

  const handleDuplicate = async (cabinet: Cabinet) => {
    try {
      await addCabinet.mutateAsync({
        joinery_item_id: joineryItem.id,
        template_id: cabinet.template_id,
        quantity: cabinet.quantity,
        type: cabinet.type,
        category: cabinet.category,
        name: cabinet.name,
        width: cabinet.width,
        height: cabinet.height,
        depth: cabinet.depth,
        quote: true, // This is a quote cabinet
        assigned_face_material: cabinet.assigned_face_material,
        extra_hinges: cabinet.extra_hinges || 0,
        extra_drawers: cabinet.extra_drawers || 0,
        end_panels_qty: cabinet.end_panels_qty || 0,
        door_qty: cabinet.door_qty,
        drawer_qty: cabinet.drawer_qty,
        shelf_qty: cabinet.shelf_qty,
        hinge_qty: cabinet.hinge_qty,
        drawer_hardware_qty: cabinet.drawer_hardware_qty,
        created_by: null, // TODO: Get from auth context when available
      })
    } catch (error: any) {
      console.error('Error duplicating cabinet:', error)
      const errorMessage = error?.message || error?.error_description || 'Unknown error occurred'
      alert(`Failed to duplicate cabinet: ${errorMessage}`)
    }
  }

  const handleToggleSelection = (cabinetId: string) => {
    const newSelection = new Set(selectedCabinets)
    if (newSelection.has(cabinetId)) {
      newSelection.delete(cabinetId)
    } else {
      newSelection.add(cabinetId)
    }
    setSelectedCabinets(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedCabinets.size === cabinets?.length) {
      setSelectedCabinets(new Set())
    } else {
      setSelectedCabinets(new Set(cabinets?.map(c => c.id) || []))
    }
  }

  const handleBulkAssignFaceMaterial = async () => {
    if (selectedCabinets.size === 0) {
      alert('Please select at least one cabinet.')
      return
    }
    if (!bulkFaceMaterial) {
      alert('Please select a face material to assign.')
      return
    }

    try {
      const updates = Array.from(selectedCabinets).map(cabinetId => 
        updateCabinet.mutateAsync({
          id: cabinetId,
          assigned_face_material: bulkFaceMaterial as 1 | 2 | 3 | 4,
        })
      )
      await Promise.all(updates)
      setSelectedCabinets(new Set())
      setBulkFaceMaterial('')
      alert(`Successfully assigned Face Material ${bulkFaceMaterial} to ${selectedCabinets.size} cabinet(s).`)
    } catch (error: any) {
      console.error('Error bulk assigning face material:', error)
      alert('Failed to assign face material. Please try again.')
    }
  }

  const handleClearFaceMaterial = async (cabinetId: string) => {
    try {
      await updateCabinet.mutateAsync({
        id: cabinetId,
        assigned_face_material: null,
      })
    } catch (error: any) {
      console.error('Error clearing face material:', error)
      alert('Failed to clear face material. Please try again.')
    }
  }

  // Get cut and edge cost setting
  const { value: cutAndEdgeCost } = useSettingValue('cut_and_edge_cost_per_sheet', 110)

  // Calculate square meter rate for carcass material
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

  // Calculate carcass cost for a cabinet
  const calculateCarcassCost = (cabinet: Cabinet, squareMeterRate: number | null): number => {
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
      // Fallback to old hardcoded logic if no formula
      const widthM = cabinetWidth / 1000
      const heightM = cabinetHeight / 1000
      const depthM = cabinetDepth / 1000
      const cabinetType = (cabinet.type || cabinet.template_cabinet?.type || '').toLowerCase()
      const cabinetCategory = (cabinet.category || cabinet.template_cabinet?.category || '').toLowerCase()
      const isTallOrWall = cabinetType.includes('tall') || cabinetType.includes('wall') || 
                           cabinetCategory.includes('tall') || cabinetCategory.includes('wall')

      if (isTallOrWall) {
        areaInSquareMeters = (widthM * ((2 * depthM) + heightM)) + (2 * depthM * heightM)
      } else {
        areaInSquareMeters = (widthM * (depthM + heightM + 0.1)) + (2 * depthM * heightM)
      }
    }

    const cost = squareMeterRate * areaInSquareMeters * cabinet.quantity

    return cost
  }

  // Calculate face material cost for a cabinet
  const calculateFaceCost = (cabinet: Cabinet, faceMaterial: Material | null | undefined): number => {
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
      // Note: The formula already includes end panels calculation (end_panels_qty * depth * height)
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
      // Fallback to old hardcoded logic if no formula
      const widthM = cabinetWidth / 1000
      const heightM = cabinetHeight / 1000
      const depthM = cabinetDepth / 1000
      const cabinetType = (cabinet.type || cabinet.template_cabinet?.type || '').toLowerCase()
      const cabinetCategory = (cabinet.category || cabinet.template_cabinet?.category || '').toLowerCase()
      const isOpenCabinet = cabinetType.includes('open') || cabinetType.includes('shelf') || 
                            cabinetCategory.includes('open') || cabinetCategory.includes('shelf')
      const isTallOrWall = cabinetType.includes('tall') || cabinetType.includes('wall') || 
                           cabinetCategory.includes('tall') || cabinetCategory.includes('wall')

      if (isOpenCabinet) {
        if (isTallOrWall) {
          areaInSquareMeters = (widthM * ((2 * depthM) + heightM)) + (2 * depthM * heightM)
        } else {
          areaInSquareMeters = (widthM * (depthM + heightM + 0.1)) + (2 * depthM * heightM)
        }
      } else {
        areaInSquareMeters = widthM * heightM
      }

      // Add end panels cost separately in fallback
      if (endPanelsQty > 0 && cabinetDepth > 0 && cabinetHeight > 0) {
        const endPanelAreaInSquareMeters = depthM * heightM
        areaInSquareMeters += endPanelAreaInSquareMeters * endPanelsQty
      }
    }

    const faceCost = faceSquareMeterRate * areaInSquareMeters * cabinet.quantity

    return faceCost
  }

  // Get face material for a cabinet based on assigned_face_material
  const getFaceMaterialForCabinet = (cabinet: Cabinet): Material | null | undefined => {
    if (!cabinet.assigned_face_material) return null

    switch (cabinet.assigned_face_material) {
      case 1:
        return joineryItem.face_material_1
      case 2:
        return joineryItem.face_material_2
      case 3:
        return joineryItem.face_material_3
      case 4:
        return joineryItem.face_material_4
      default:
        return null
    }
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

  // Calculate number of hinges per cabinet
  const calculateHingesPerCabinet = (cabinet: Cabinet): number => {
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
  const calculateHingeCost = (cabinet: Cabinet): number => {
    if (!joineryItem.hinge || !joineryItem.hinge.cost_per_unit) {
      return 0
    }

    const hingesPerCabinet = calculateHingesPerCabinet(cabinet)
    const totalHinges = (hingesPerCabinet + (cabinet.extra_hinges || 0)) * cabinet.quantity
    if (totalHinges === 0) return 0

    const costPerHinge = joineryItem.hinge.cost_per_unit
    const totalCost = costPerHinge * totalHinges

    return totalCost
  }

  // Calculate number of drawer hardware per cabinet
  const calculateDrawerHardwarePerCabinet = (cabinet: Cabinet): number => {
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
  const calculateDrawerHardwareCost = (cabinet: Cabinet): number => {
    if (!joineryItem.drawer_hardware || !joineryItem.drawer_hardware.cost_per_unit) {
      return 0
    }

    const drawerHardwarePerCabinet = calculateDrawerHardwarePerCabinet(cabinet)
    const totalDrawerHardware = (drawerHardwarePerCabinet + (cabinet.extra_drawers || 0)) * cabinet.quantity
    if (totalDrawerHardware === 0) return 0

    const costPerDrawerHardware = joineryItem.drawer_hardware.cost_per_unit
    const totalCost = costPerDrawerHardware * totalDrawerHardware

    return totalCost
  }

  // Calculate costs for all cabinets - MUST be before any conditional returns
  const carcassSquareMeterRate = useMemo(() => {
    return calculateSquareMeterRate(joineryItem.carcass_material)
  }, [joineryItem.carcass_material])

  const cabinetCosts = useMemo(() => {
    if (!cabinets) return []
    return cabinets.map(cabinet => {
      const carcassCost = calculateCarcassCost(cabinet, carcassSquareMeterRate)
      const faceMaterial = getFaceMaterialForCabinet(cabinet)
      const faceCost = calculateFaceCost(cabinet, faceMaterial)
      const hingeCost = calculateHingeCost(cabinet)
      const drawerHardwareCost = calculateDrawerHardwareCost(cabinet)
      const totalCost = carcassCost + faceCost + hingeCost + drawerHardwareCost
      
      return {
        cabinetId: cabinet.id,
        carcassCost,
        faceCost,
        hingeCost,
        drawerHardwareCost,
        totalCost
      }
    })
  }, [cabinets, carcassSquareMeterRate, joineryItem.face_material_1, joineryItem.face_material_2, joineryItem.face_material_3, joineryItem.face_material_4, joineryItem.hinge, joineryItem.drawer_hardware])

  const totalCarcassCost = useMemo(() => {
    return cabinetCosts.reduce((sum, item) => sum + item.carcassCost, 0)
  }, [cabinetCosts])

  const totalFaceCost = useMemo(() => {
    return cabinetCosts.reduce((sum, item) => sum + item.faceCost, 0)
  }, [cabinetCosts])

  const totalCabinetCost = useMemo(() => {
    return cabinetCosts.reduce((sum, item) => sum + item.totalCost, 0)
  }, [cabinetCosts])

  // Report total cost changes to parent
  useEffect(() => {
    if (onTotalCostChange) {
      onTotalCostChange(totalCabinetCost)
    }
  }, [totalCabinetCost, onTotalCostChange])

  if (cabinetsLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const hasCabinetsInLibrary = (allCabinets?.length || 0) > 0
  const hasSelectedCabinets = selectedCabinets.size > 0

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h5 className="text-sm font-medium text-gray-700">Cabinets</h5>
      </div>

      {/* Always show Add Cabinet Form at the top */}
      {hasCabinetsInLibrary && (
        <AddCabinetForm
          availableCabinets={availableCabinets}
          onAdd={handleAdd}
        />
      )}

      {/* Show message if no cabinets available */}
      {!hasCabinetsInLibrary && (
        <div className="p-3 bg-yellow-50 rounded border border-yellow-200 text-sm text-yellow-800">
          No cabinets available in the library. Please add cabinets to the library first.
        </div>
      )}

      {/* Bulk Actions */}
      {cabinets && cabinets.length > 0 && (
        <div className="p-3 bg-blue-50 rounded border border-blue-200 space-y-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
            >
              {selectedCabinets.size === cabinets.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span>
                {selectedCabinets.size === cabinets.length ? 'Deselect All' : 'Select All'}
                {hasSelectedCabinets && ` (${selectedCabinets.size} selected)`}
              </span>
            </button>
          </div>
          
          {hasSelectedCabinets && availableFaceMaterials.length > 0 && (
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-gray-700">Assign Face Material:</label>
              <select
                value={bulkFaceMaterial}
                onChange={(e) => setBulkFaceMaterial(e.target.value as 1 | 2 | 3 | 4 | '')}
                className="px-2 py-1 text-sm border border-gray-300 rounded"
              >
                <option value="">Select face material...</option>
                {availableFaceMaterials.map((fm) => (
                  <option key={fm.number} value={fm.number}>
                    Face Material {fm.number}
                    {fm.material && ` - ${fm.material.name}`}
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkAssignFaceMaterial}
                disabled={!bulkFaceMaterial}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Assign
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cabinets List */}
      {cabinets && cabinets.length > 0 ? (
        <CabinetGroups
          cabinets={cabinets}
          cabinetCosts={cabinetCosts}
          selectedCabinets={selectedCabinets}
          editingCabinet={editingCabinet}
          joineryItem={joineryItem}
          onToggleSelection={handleToggleSelection}
          onEdit={setEditingCabinet}
          onCancelEdit={() => setEditingCabinet(null)}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          onDuplicate={handleDuplicate}
          onClearFaceMaterial={handleClearFaceMaterial}
          totalCarcassCost={totalCarcassCost}
          totalFaceCost={totalFaceCost}
          totalCabinetCost={totalCabinetCost}
          carcassSquareMeterRate={carcassSquareMeterRate}
          calculateHingesPerCabinet={calculateHingesPerCabinet}
          calculateDrawerHardwarePerCabinet={calculateDrawerHardwarePerCabinet}
        />
      ) : (
        <div className="text-sm text-gray-500 py-2">
          {hasCabinetsInLibrary ? (
            'No cabinets assigned. Click "Add Cabinet" to get started.'
          ) : (
            'No cabinets in library. Add standard cabinets to the library first from the Standard Cabinets page.'
          )}
        </div>
      )}
    </div>
  )
}

function CabinetGroups({
  cabinets,
  cabinetCosts,
  selectedCabinets,
  editingCabinet,
  joineryItem,
  onToggleSelection,
  onEdit,
  onCancelEdit,
  onUpdate,
  onRemove,
  onDuplicate,
  onClearFaceMaterial,
  totalCarcassCost,
  totalFaceCost,
  totalCabinetCost,
  carcassSquareMeterRate,
  calculateHingesPerCabinet,
  calculateDrawerHardwarePerCabinet,
}: {
  cabinets: Cabinet[]
  cabinetCosts: Array<{ cabinetId: string; carcassCost: number; faceCost: number; hingeCost: number; drawerHardwareCost: number; totalCost: number }>
  selectedCabinets: Set<string>
  editingCabinet: Cabinet | null
  joineryItem: JoineryItem
  onToggleSelection: (cabinetId: string) => void
  onEdit: (cabinet: Cabinet) => void
  onCancelEdit: () => void
  onUpdate: (id: string, updates: Partial<Cabinet>) => void
  onRemove: (id: string) => void
  onDuplicate: (cabinet: Cabinet) => void
  onClearFaceMaterial: (cabinetId: string) => void
  totalCarcassCost: number
  totalFaceCost: number
  totalCabinetCost: number
  carcassSquareMeterRate: number | null
  calculateHingesPerCabinet: (cabinet: Cabinet) => number
  calculateDrawerHardwarePerCabinet: (cabinet: Cabinet) => number
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const initializedRef = useRef(false)

  // Group cabinets by face material
  const groupedCabinets = useMemo(() => {
    const groups: Record<string, Cabinet[]> = {
      'no-face': [],
      'face-1': [],
      'face-2': [],
      'face-3': [],
      'face-4': [],
    }

    cabinets.forEach(cabinet => {
      if (!cabinet.assigned_face_material) {
        groups['no-face'].push(cabinet)
      } else {
        groups[`face-${cabinet.assigned_face_material}`].push(cabinet)
      }
    })

    return groups
  }, [cabinets])

  // Initialize expanded groups with all groups that have cabinets (only once)
  useEffect(() => {
    if (!initializedRef.current && Object.keys(groupedCabinets).some(key => groupedCabinets[key].length > 0)) {
      const initialExpanded = new Set<string>()
      Object.keys(groupedCabinets).forEach(key => {
        if (groupedCabinets[key].length > 0) {
          initialExpanded.add(key)
        }
      })
      if (initialExpanded.size > 0) {
        setExpandedGroups(initialExpanded)
        initializedRef.current = true
      }
    }
  }, [groupedCabinets])

  // Get face material name for group
  const getFaceMaterialName = (groupKey: string): string => {
    if (groupKey === 'no-face') return 'No Face Material'
    const faceNum = parseInt(groupKey.split('-')[1])
    const material = faceNum === 1 ? joineryItem.face_material_1 :
                    faceNum === 2 ? joineryItem.face_material_2 :
                    faceNum === 3 ? joineryItem.face_material_3 :
                    faceNum === 4 ? joineryItem.face_material_4 : null
    return material ? `Face Material ${faceNum}: ${material.name}` : `Face Material ${faceNum}`
  }

  // Get color classes for group header based on face material
  const getGroupHeaderColors = (groupKey: string): { bg: string; border: string; hover: string } => {
    if (groupKey === 'no-face') {
      return { bg: 'bg-gray-50', border: 'border-gray-200', hover: 'hover:bg-gray-100' }
    }
    const faceNum = parseInt(groupKey.split('-')[1])
    switch (faceNum) {
      case 1:
        return { bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:bg-blue-100' }
      case 2:
        return { bg: 'bg-green-50', border: 'border-green-200', hover: 'hover:bg-green-100' }
      case 3:
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', hover: 'hover:bg-yellow-100' }
      case 4:
        return { bg: 'bg-purple-50', border: 'border-purple-200', hover: 'hover:bg-purple-100' }
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', hover: 'hover:bg-gray-100' }
    }
  }

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey)
    } else {
      newExpanded.add(groupKey)
    }
    setExpandedGroups(newExpanded)
  }

  // Calculate group totals
  const getGroupTotal = (groupKey: string): number => {
    const groupCabinets = groupedCabinets[groupKey] || []
    return groupCabinets.reduce((sum, cabinet) => {
      const costInfo = cabinetCosts.find(cc => cc.cabinetId === cabinet.id)
      return sum + (costInfo?.totalCost || 0)
    }, 0)
  }

  return (
    <div className="space-y-2">
      {Object.entries(groupedCabinets).map(([groupKey, groupCabinets]) => {
        if (groupCabinets.length === 0) return null
        
        const isExpanded = expandedGroups.has(groupKey)
        const groupTotal = getGroupTotal(groupKey)
        const groupCount = groupCabinets.length

        const headerColors = getGroupHeaderColors(groupKey)
        
        return (
          <div key={groupKey} className={`border rounded ${headerColors.border}`}>
            <button
              onClick={() => toggleGroup(groupKey)}
              className={`w-full flex items-center justify-between p-2 transition-colors ${headerColors.bg} ${headerColors.hover}`}
            >
              <div className="flex items-center space-x-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {getFaceMaterialName(groupKey)}
                </span>
                <span className="text-xs text-gray-500">
                  ({groupCount} {groupCount === 1 ? 'cabinet' : 'cabinets'})
                </span>
                {groupTotal > 0 && (
                  <span className="text-xs font-medium text-gray-900">
                    ${groupTotal.toFixed(2)}
                  </span>
                )}
              </div>
            </button>
            
            {isExpanded && (
              <div className="p-2 space-y-2">
                {groupCabinets.map((jc) => {
                  const cabinetCostInfo = cabinetCosts.find(cc => cc.cabinetId === jc.id)
                  return (
                    <CabinetRow
                      key={jc.id}
                      quoteJoineryItemCabinet={jc}
                      isEditing={editingCabinet?.id === jc.id}
                      isSelected={selectedCabinets.has(jc.id)}
                      onToggleSelection={() => onToggleSelection(jc.id)}
                      onEdit={() => onEdit(jc)}
                      onCancelEdit={onCancelEdit}
                      onUpdate={(updates) => onUpdate(jc.id, updates)}
                      onRemove={() => onRemove(jc.id)}
                      onDuplicate={() => onDuplicate(jc)}
                      onClearFaceMaterial={() => onClearFaceMaterial(jc.id)}
                      joineryItem={joineryItem}
                      carcassCost={cabinetCostInfo?.carcassCost || 0}
                      faceCost={cabinetCostInfo?.faceCost || 0}
                      hingeCost={cabinetCostInfo?.hingeCost || 0}
                      drawerHardwareCost={cabinetCostInfo?.drawerHardwareCost || 0}
                      totalCost={cabinetCostInfo?.totalCost || 0}
                      calculateHingesPerCabinet={calculateHingesPerCabinet}
                      calculateDrawerHardwarePerCabinet={calculateDrawerHardwarePerCabinet}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
      
      {/* Total Cost Summary */}
      {(totalCarcassCost > 0 || totalFaceCost > 0) && (
        <div className="mt-4 p-3 bg-gray-100 rounded border border-gray-300">
          <div className="space-y-2">
            {totalCarcassCost > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Total Carcass Cost:</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ${totalCarcassCost.toFixed(2)}
                </span>
              </div>
            )}
            {totalFaceCost > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Total Face Cost:</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ${totalFaceCost.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-gray-300">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-semibold text-gray-900">Total Cabinet Cost:</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                ${totalCabinetCost.toFixed(2)}
              </span>
            </div>
          </div>
          {joineryItem.carcass_material && totalCarcassCost > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Carcass: {joineryItem.carcass_material.name}
              {carcassSquareMeterRate && ` ($${carcassSquareMeterRate.toFixed(2)}/m²)`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function CabinetRow({
  quoteJoineryItemCabinet,
  isEditing,
  isSelected,
  onToggleSelection,
  onEdit,
  onCancelEdit,
  onUpdate,
  onRemove,
  onDuplicate,
  onClearFaceMaterial,
  joineryItem,
  carcassCost,
  faceCost,
  hingeCost,
  drawerHardwareCost,
  totalCost,
  calculateHingesPerCabinet,
  calculateDrawerHardwarePerCabinet,
  isHighlighted,
  onSelect,
}: {
  quoteJoineryItemCabinet: Cabinet
  isEditing: boolean
  isSelected: boolean
  onToggleSelection: () => void
  onEdit: () => void
  onCancelEdit: () => void
  onUpdate: (updates: Partial<Cabinet>) => void
  onRemove: () => void
  onDuplicate: () => void
  onClearFaceMaterial: () => void
  joineryItem: JoineryItem
  isHighlighted?: boolean
  onSelect?: () => void
  carcassCost: number
  faceCost: number
  hingeCost: number
  drawerHardwareCost: number
  totalCost: number
  calculateHingesPerCabinet: (cabinet: Cabinet) => number
  calculateDrawerHardwarePerCabinet: (cabinet: Cabinet) => number
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [quantity, setQuantity] = useState(quoteJoineryItemCabinet.quantity.toString())
  const [width, setWidth] = useState(quoteJoineryItemCabinet.width?.toString() || '')
  const [height, setHeight] = useState(quoteJoineryItemCabinet.height?.toString() || '')
  const [depth, setDepth] = useState(quoteJoineryItemCabinet.depth?.toString() || '')
  const [inlineQuantity, setInlineQuantity] = useState(quoteJoineryItemCabinet.quantity.toString())
  const [extraHinges, setExtraHinges] = useState((quoteJoineryItemCabinet.extra_hinges || 0).toString())
  const [extraDrawers, setExtraDrawers] = useState((quoteJoineryItemCabinet.extra_drawers || 0).toString())
  const [endPanelsQty, setEndPanelsQty] = useState((quoteJoineryItemCabinet.end_panels_qty || 0).toString())
  const [doorQty, setDoorQty] = useState((quoteJoineryItemCabinet.door_qty || 0).toString())
  const [drawerQty, setDrawerQty] = useState((quoteJoineryItemCabinet.drawer_qty || 0).toString())
  const [shelfQty, setShelfQty] = useState((quoteJoineryItemCabinet.shelf_qty || 0).toString())

  // Update inline quantity when cabinet quantity changes externally
  useEffect(() => {
    setInlineQuantity(quoteJoineryItemCabinet.quantity.toString())
  }, [quoteJoineryItemCabinet.quantity])

  // Update extra hardware fields when cabinet changes externally
  useEffect(() => {
    setQuantity(quoteJoineryItemCabinet.quantity.toString())
    setWidth(quoteJoineryItemCabinet.width?.toString() || '')
    setHeight(quoteJoineryItemCabinet.height?.toString() || '')
    setDepth(quoteJoineryItemCabinet.depth?.toString() || '')
    setExtraHinges((quoteJoineryItemCabinet.extra_hinges || 0).toString())
    setExtraDrawers((quoteJoineryItemCabinet.extra_drawers || 0).toString())
    setEndPanelsQty((quoteJoineryItemCabinet.end_panels_qty || 0).toString())
    setDoorQty((quoteJoineryItemCabinet.door_qty || 0).toString())
    setDrawerQty((quoteJoineryItemCabinet.drawer_qty || 0).toString())
    setShelfQty((quoteJoineryItemCabinet.shelf_qty || 0).toString())
  }, [quoteJoineryItemCabinet.extra_hinges, quoteJoineryItemCabinet.extra_drawers, quoteJoineryItemCabinet.end_panels_qty, quoteJoineryItemCabinet.door_qty, quoteJoineryItemCabinet.drawer_qty, quoteJoineryItemCabinet.shelf_qty, quoteJoineryItemCabinet.quantity, quoteJoineryItemCabinet.width, quoteJoineryItemCabinet.height, quoteJoineryItemCabinet.depth])

  // Handle quantity change and save on blur
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInlineQuantity(e.target.value)
  }

  const handleQuantityBlur = () => {
    const newQuantity = parseInt(inlineQuantity) || 1
    if (newQuantity !== quoteJoineryItemCabinet.quantity && newQuantity > 0) {
      onUpdate({ quantity: newQuantity })
    } else if (newQuantity <= 0) {
      // Reset to current value if invalid
      setInlineQuantity(quoteJoineryItemCabinet.quantity.toString())
    }
  }

  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  const cabinet = quoteJoineryItemCabinet.template_cabinet
  const hasCustomDimensions = quoteJoineryItemCabinet.width !== cabinet?.width || 
                              quoteJoineryItemCabinet.height !== cabinet?.height || 
                              quoteJoineryItemCabinet.depth !== cabinet?.depth

  // Get effective dimensions (use cabinet's own values)
  const effectiveWidth = quoteJoineryItemCabinet.width ?? cabinet?.width ?? 0
  const effectiveHeight = quoteJoineryItemCabinet.height ?? cabinet?.height ?? 0
  const effectiveDepth = quoteJoineryItemCabinet.depth ?? cabinet?.depth ?? 0

  // Get assigned face material info
  const assignedFaceMaterial = quoteJoineryItemCabinet.assigned_face_material
  const faceMaterialInfo = assignedFaceMaterial ? {
    number: assignedFaceMaterial,
    material: assignedFaceMaterial === 1 ? joineryItem.face_material_1 :
              assignedFaceMaterial === 2 ? joineryItem.face_material_2 :
              assignedFaceMaterial === 3 ? joineryItem.face_material_3 :
              assignedFaceMaterial === 4 ? joineryItem.face_material_4 : null,
  } : null

  const cabinetType = quoteJoineryItemCabinet.type || cabinet?.type
  const showDoorQty = cabinetType === 'door'
  const showDrawerQty = cabinetType === 'drawer'
  const showShelfQty = cabinetType === 'door' || cabinetType === 'open'

  // Get available face materials
  const availableFaceMaterials = [
    { number: 1 as const, material: joineryItem.face_material_1, materialId: joineryItem.face_material_1_id },
    { number: 2 as const, material: joineryItem.face_material_2, materialId: joineryItem.face_material_2_id },
    { number: 3 as const, material: joineryItem.face_material_3, materialId: joineryItem.face_material_3_id },
    { number: 4 as const, material: joineryItem.face_material_4, materialId: joineryItem.face_material_4_id },
  ].filter(fm => fm.materialId !== null)

  // Auto-expand when editing starts
  useEffect(() => {
    if (isEditing && !isExpanded) {
      setIsExpanded(true)
    }
  }, [isEditing])

  const handleSave = () => {
    const updates: Partial<Cabinet> = {
      quantity: parseInt(quantity) || 1,
      width: width ? parseFloat(width) : null,
      height: height ? parseFloat(height) : null,
      depth: depth ? parseFloat(depth) : null,
      extra_hinges: parseInt(extraHinges) || 0,
      extra_drawers: parseInt(extraDrawers) || 0,
      end_panels_qty: parseInt(endPanelsQty) || 0,
    }
    
    // Only add quantity fields if they should be shown
    if (showDoorQty) {
      updates.door_qty = parseInt(doorQty) || 0
    }
    if (showDrawerQty) {
      updates.drawer_qty = parseInt(drawerQty) || 0
    }
    if (showShelfQty) {
      updates.shelf_qty = parseInt(shelfQty) || 0
    }
    
    onUpdate(updates)
  }

  const cabinetName = quoteJoineryItemCabinet.name || cabinet?.name || `${quoteJoineryItemCabinet.category || cabinet?.category} - ${quoteJoineryItemCabinet.type || cabinet?.type}` || 'Unknown Cabinet'

  return (
    <div className={`border rounded transition-colors ${
      isSelected 
        ? 'bg-blue-50 border-blue-300' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      {/* Collapsed/Expanded Header Row */}
      <div className="flex items-center space-x-2 p-2">
        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Selection Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelection()
          }}
          className="flex-shrink-0 text-blue-600 hover:text-blue-700"
          title={isSelected ? 'Deselect' : 'Select'}
        >
          {isSelected ? (
            <CheckSquare className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>

        {/* Cabinet Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {cabinetName}
          </p>
        </div>

        {/* Dimensions (W, H, D) */}
        <div className="flex items-center space-x-1 text-xs text-gray-600">
          <span>W: {isEditing ? (
            <input
              type="number"
              step="0.01"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder={cabinet?.width?.toString() || '0'}
              className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded text-center"
            />
          ) : (
            <span className="font-medium">{effectiveWidth}mm</span>
          )}</span>
          <span>H: {isEditing ? (
            <input
              type="number"
              step="0.01"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder={cabinet?.height?.toString() || '0'}
              className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded text-center"
            />
          ) : (
            <span className="font-medium">{effectiveHeight}mm</span>
          )}</span>
          <span>D: {isEditing ? (
            <input
              type="number"
              step="0.01"
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              placeholder={cabinet?.depth?.toString() || '0'}
              className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded text-center"
            />
          ) : (
            <span className="font-medium">{effectiveDepth}mm</span>
          )}</span>
        </div>

        {/* Quantity (Editable) */}
        <div className="flex items-center space-x-1">
          <Hash className="h-3 w-3 text-gray-400" />
          {isEditing ? (
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-16 px-1 py-0.5 text-sm text-gray-700 border border-gray-300 rounded text-center"
            />
          ) : (
            <input
              type="number"
              min="1"
              value={inlineQuantity}
              onChange={handleQuantityChange}
              onBlur={handleQuantityBlur}
              onKeyDown={handleQuantityKeyDown}
              className="w-16 px-1 py-0.5 text-sm text-gray-700 border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              title="Click to edit quantity"
            />
          )}
        </div>

        {/* Cost */}
        {totalCost > 0 && (
          <div className="flex items-center space-x-1 text-gray-900 font-semibold text-sm">
            <DollarSign className="h-4 w-4" />
            <span>${totalCost.toFixed(2)}</span>
          </div>
        )}

        {/* Action Buttons - only show in collapsed state or when editing */}
        {!isExpanded && !isEditing && (
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate()
              }}
              className="text-gray-400 hover:text-green-600 transition-colors"
              title="Duplicate cabinet"
            >
              <Copy className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit cabinet"
            >
              <Edit className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="text-gray-400 hover:text-red-600 transition-colors"
              title="Remove"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Save/Cancel buttons when editing */}
        {isEditing && (
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleSave()
              }}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCancelEdit()
              }}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-2 pb-2 border-t border-gray-200 pt-2">
          <div className="flex gap-4">
            {/* Left Side - Details */}
            <div className="flex-1 space-y-3">
              {/* Face Material Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Face Material:</label>
                {isEditing ? (
                  <select
                    value={quoteJoineryItemCabinet.assigned_face_material || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : parseInt(e.target.value) as 1 | 2 | 3 | 4
                      onUpdate({ assigned_face_material: value })
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  >
                    <option value="">None</option>
                    {availableFaceMaterials.map((fm) => (
                      <option key={fm.number} value={fm.number}>
                        Face Material {fm.number}{fm.material && ` - ${fm.material.name}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    {faceMaterialInfo && faceMaterialInfo.material ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-blue-600">
                          Face Material {faceMaterialInfo.number}: <span className="font-medium">{faceMaterialInfo.material.name}</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onClearFaceMaterial()
                          }}
                          className="text-xs text-red-600 hover:text-red-700"
                          title="Clear face material"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No face material assigned</span>
                    )}
                  </div>
                )}
              </div>

              {/* Additional Details */}
              <div className="space-y-2">
                {isEditing ? (
                  <div className="space-y-1 text-xs">
                    {/* Dynamic Fields based on cabinet type */}
                    {showDoorQty && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Door Qty:</span>
                        <input
                          type="number"
                          min="0"
                          value={doorQty}
                          onChange={(e) => setDoorQty(e.target.value)}
                          className="w-20 px-1.5 py-0.5 text-xs border border-gray-300 rounded"
                        />
                      </div>
                    )}

                    {showDrawerQty && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Drawer Qty:</span>
                        <input
                          type="number"
                          min="0"
                          value={drawerQty}
                          onChange={(e) => setDrawerQty(e.target.value)}
                          className="w-20 px-1.5 py-0.5 text-xs border border-gray-300 rounded"
                        />
                      </div>
                    )}

                    {showShelfQty && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Shelf Qty:</span>
                        <input
                          type="number"
                          min="0"
                          value={shelfQty}
                          onChange={(e) => setShelfQty(e.target.value)}
                          className="w-20 px-1.5 py-0.5 text-xs border border-gray-300 rounded"
                        />
                      </div>
                    )}

                    {/* End Panels */}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">End Panels:</span>
                      <input
                        type="number"
                        min="0"
                        value={endPanelsQty}
                        onChange={(e) => setEndPanelsQty(e.target.value)}
                        className="w-20 px-1.5 py-0.5 text-xs border border-gray-300 rounded"
                        placeholder="0"
                      />
                    </div>

                    {/* Extra Hardware */}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Extra Hinges:</span>
                      <input
                        type="number"
                        min="0"
                        value={extraHinges}
                        onChange={(e) => setExtraHinges(e.target.value)}
                        className="w-20 px-1.5 py-0.5 text-xs border border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-400">
                        (Base: {calculateHingesPerCabinet(quoteJoineryItemCabinet)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Extra Drawers:</span>
                      <input
                        type="number"
                        min="0"
                        value={extraDrawers}
                        onChange={(e) => setExtraDrawers(e.target.value)}
                        className="w-20 px-1.5 py-0.5 text-xs border border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-400">
                        (Base: {calculateDrawerHardwarePerCabinet(quoteJoineryItemCabinet)})
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs">
                    {showDoorQty && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Door Qty:</span>
                        <span className="font-medium text-gray-900">{quoteJoineryItemCabinet.door_qty ?? cabinet?.door_qty ?? 0}</span>
                      </div>
                    )}
                    {showDrawerQty && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Drawer Qty:</span>
                        <span className="font-medium text-gray-900">{quoteJoineryItemCabinet.drawer_qty ?? cabinet?.drawer_qty ?? 0}</span>
                      </div>
                    )}
                    {showShelfQty && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Shelf Qty:</span>
                        <span className="font-medium text-gray-900">{quoteJoineryItemCabinet.shelf_qty ?? cabinet?.shelf_qty ?? 0}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">End Panels:</span>
                      <span className="font-medium text-gray-900">{quoteJoineryItemCabinet.end_panels_qty ?? cabinet?.end_panels_qty ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Hinges (Base):</span>
                      <span className="font-medium text-gray-900">{calculateHingesPerCabinet(quoteJoineryItemCabinet)}</span>
                    </div>
                    {(quoteJoineryItemCabinet.extra_hinges || 0) > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Extra Hinges:</span>
                        <span className="font-medium text-gray-900">{quoteJoineryItemCabinet.extra_hinges || 0}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Drawer Hardware (Base):</span>
                      <span className="font-medium text-gray-900">{calculateDrawerHardwarePerCabinet(quoteJoineryItemCabinet)}</span>
                    </div>
                    {(quoteJoineryItemCabinet.extra_drawers || 0) > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Extra Drawers:</span>
                        <span className="font-medium text-gray-900">{quoteJoineryItemCabinet.extra_drawers || 0}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons in Expanded State (when not editing) */}
              {!isEditing && (
                <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDuplicate()
                    }}
                    className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-green-600 border border-gray-300 rounded hover:border-green-600 transition-colors"
                    title="Duplicate cabinet"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Duplicate</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                    className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-blue-600 border border-gray-300 rounded hover:border-blue-600 transition-colors"
                    title="Edit cabinet"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove()
                    }}
                    className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-red-600 border border-gray-300 rounded hover:border-red-600 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Side - Price Breakdown */}
            {totalCost > 0 && (
              <div className="w-48 flex-shrink-0 border-l border-gray-200 pl-4">
                <h6 className="text-xs font-semibold text-gray-700 mb-2">Price Breakdown</h6>
                <div className="space-y-2 text-xs">
                  {carcassCost > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Carcass:</span>
                      <span className="text-green-600 font-medium">${carcassCost.toFixed(2)}</span>
                    </div>
                  )}
                  {faceCost > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Face:</span>
                      <span className="text-blue-600 font-medium">${faceCost.toFixed(2)}</span>
                    </div>
                  )}
                  {hingeCost > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Hinges:</span>
                      <span className="text-purple-600 font-medium">${hingeCost.toFixed(2)}</span>
                    </div>
                  )}
                  {drawerHardwareCost > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Drawers:</span>
                      <span className="text-orange-600 font-medium">${drawerHardwareCost.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-200 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 font-semibold">Total:</span>
                      <span className="text-gray-900 font-bold text-sm">${totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AddCabinetForm({
  availableCabinets,
  onAdd,
}: {
  availableCabinets: any[]
  onAdd: (
    cabinetId: string, 
    quantity: number, 
    customDimensions?: { width?: number; height?: number; depth?: number },
    doorQty?: number,
    drawerQty?: number,
    shelfQty?: number,
    onReset?: () => void
  ) => void
}) {
  const [selectedCabinetId, setSelectedCabinetId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [customWidth, setCustomWidth] = useState('')
  const [customHeight, setCustomHeight] = useState('')
  const [customDepth, setCustomDepth] = useState('')
  const [doorQty, setDoorQty] = useState('')
  const [drawerQty, setDrawerQty] = useState('')
  const [shelfQty, setShelfQty] = useState('')

  const selectedCabinet = availableCabinets.find(c => c.id === selectedCabinetId)
  const cabinetType = selectedCabinet?.type

  // Determine which fields to show based on cabinet type
  const showDoorQty = cabinetType === 'door'
  const showDrawerQty = cabinetType === 'drawer'
  const showShelfQty = cabinetType === 'door' || cabinetType === 'open'
  const showDynamicFields = showDoorQty || showDrawerQty || showShelfQty

  const resetForm = () => {
    setSelectedCabinetId('')
    setQuantity('1')
    setCustomWidth('')
    setCustomHeight('')
    setCustomDepth('')
    setDoorQty('')
    setDrawerQty('')
    setShelfQty('')
  }

  // Reset dynamic fields when cabinet selection changes
  useEffect(() => {
    setDoorQty('')
    setDrawerQty('')
    setShelfQty('')
  }, [selectedCabinetId])

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

    const doorQtyNum = showDoorQty && doorQty ? parseInt(doorQty) : undefined
    const drawerQtyNum = showDrawerQty && drawerQty ? parseInt(drawerQty) : undefined
    const shelfQtyNum = showShelfQty && shelfQty ? parseInt(shelfQty) : undefined

    onAdd(
      selectedCabinetId, 
      parseFloat(quantity), 
      customDimensions, 
      doorQtyNum,
      drawerQtyNum,
      shelfQtyNum,
      resetForm
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-2 bg-gray-50 rounded border border-gray-200">
      <div className="flex items-center gap-2">
        {/* Select Cabinet */}
        <div className="flex-1 min-w-0">
          <select
            value={selectedCabinetId}
            onChange={(e) => setSelectedCabinetId(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
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

        {/* Quantity */}
        <div className="w-20">
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
            placeholder="Qty"
            required
          />
        </div>

        {/* Width */}
        <div className="w-24">
          <input
            type="number"
            step="0.01"
            value={customWidth}
            onChange={(e) => setCustomWidth(e.target.value)}
            placeholder={selectedCabinet?.width?.toString() || 'W (mm)'}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
          />
        </div>

        {/* Height */}
        <div className="w-24">
          <input
            type="number"
            step="0.01"
            value={customHeight}
            onChange={(e) => setCustomHeight(e.target.value)}
            placeholder={selectedCabinet?.height?.toString() || 'H (mm)'}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
          />
        </div>

        {/* Depth */}
        <div className="w-24">
          <input
            type="number"
            step="0.01"
            value={customDepth}
            onChange={(e) => setCustomDepth(e.target.value)}
            placeholder={selectedCabinet?.depth?.toString() || 'D (mm)'}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
          />
        </div>

        {/* Dynamic Fields based on cabinet type */}
        {showDoorQty && (
          <div className="w-20">
            <input
              type="number"
              min="0"
              value={doorQty}
              onChange={(e) => setDoorQty(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
              placeholder="Door Qty"
            />
          </div>
        )}

        {showDrawerQty && (
          <div className="w-20">
            <input
              type="number"
              min="0"
              value={drawerQty}
              onChange={(e) => setDrawerQty(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
              placeholder="Drawer Qty"
            />
          </div>
        )}

        {showShelfQty && (
          <div className="w-20">
            <input
              type="number"
              min="0"
              value={shelfQty}
              onChange={(e) => setShelfQty(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
              placeholder="Shelf Qty"
            />
          </div>
        )}

        {/* Add Button */}
        <button
          type="submit"
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
        >
          Add Cabinet
        </button>
      </div>
    </form>
  )
}
