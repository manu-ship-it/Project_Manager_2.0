'use client'

import { useState } from 'react'
import { Package } from 'lucide-react'
import { useMaterials } from '@/hooks/useMaterials'
import { useHardware } from '@/hooks/useHardware'
import { useUpdateQuoteJoineryItem } from '@/hooks/useQuoteJoineryItems'
import { JoineryItem, Material, Hardware } from '@/lib/supabase'

interface QuoteJoineryItemMaterialsProps {
  joineryItem: JoineryItem
}

export function QuoteJoineryItemMaterials({ joineryItem }: QuoteJoineryItemMaterialsProps) {
  const { data: allMaterials, isLoading: materialsLoading } = useMaterials()
  const { data: allHardware, isLoading: hardwareLoading } = useHardware()
  const updateJoineryItem = useUpdateQuoteJoineryItem()

  const handleMaterialChange = async (field: 'carcass_material_id' | 'face_material_1_id' | 'face_material_2_id' | 'face_material_3_id' | 'face_material_4_id', materialId: string | null) => {
    try {
      await updateJoineryItem.mutateAsync({
        id: joineryItem.id,
        quote_proj_id: joineryItem.quote_proj_id,
        [field]: materialId || null,
      })
    } catch (error: any) {
      console.error('Error updating material:', error)
      const errorMessage = error?.message || error?.error_description || 'Failed to update material. Please try again.'
      alert(`Error updating material: ${errorMessage}`)
    }
  }

  const handleHingeChange = async (hingeId: string | null) => {
    try {
      await updateJoineryItem.mutateAsync({
        id: joineryItem.id,
        quote_proj_id: joineryItem.quote_proj_id,
        hinge_id: hingeId || null,
      })
    } catch (error: any) {
      console.error('Error updating hinge:', error)
      const errorMessage = error?.message || error?.error_description || 'Failed to update hinge. Please try again.'
      alert(`Error updating hinge: ${errorMessage}`)
    }
  }

  const handleDrawerHardwareChange = async (drawerHardwareId: string | null) => {
    try {
      await updateJoineryItem.mutateAsync({
        id: joineryItem.id,
        quote_proj_id: joineryItem.quote_proj_id,
        drawer_hardware_id: drawerHardwareId || null,
      })
    } catch (error: any) {
      console.error('Error updating drawer hardware:', error)
      const errorMessage = error?.message || error?.error_description || 'Failed to update drawer hardware. Please try again.'
      alert(`Error updating drawer hardware: ${errorMessage}`)
    }
  }

  if (materialsLoading || hardwareLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const faceMaterials = [
    {
      label: 'Face Material 1',
      field: 'face_material_1_id' as const,
      material: joineryItem.face_material_1,
      materialId: joineryItem.face_material_1_id,
      colorClass: 'bg-blue-50 border-blue-200',
    },
    {
      label: 'Face Material 2',
      field: 'face_material_2_id' as const,
      material: joineryItem.face_material_2,
      materialId: joineryItem.face_material_2_id,
      colorClass: 'bg-green-50 border-green-200',
    },
    {
      label: 'Face Material 3',
      field: 'face_material_3_id' as const,
      material: joineryItem.face_material_3,
      materialId: joineryItem.face_material_3_id,
      colorClass: 'bg-yellow-50 border-yellow-200',
    },
    {
      label: 'Face Material 4',
      field: 'face_material_4_id' as const,
      material: joineryItem.face_material_4,
      materialId: joineryItem.face_material_4_id,
      colorClass: 'bg-purple-50 border-purple-200',
    },
  ]

  return (
    <div>
      <h5 className="text-sm font-medium text-gray-700 mb-2">Materials</h5>
      <div className="space-y-2">
        {/* Row 1: 4 Face Materials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {faceMaterials.map((row) => (
            <MaterialRow
              key={row.field}
              label={row.label}
              field={row.field}
              selectedMaterial={row.material}
              selectedMaterialId={row.materialId}
              availableMaterials={allMaterials || []}
              onMaterialChange={(materialId) => handleMaterialChange(row.field, materialId)}
              colorClass={row.colorClass}
            />
          ))}
        </div>

        {/* Row 2: Carcass Material */}
        <div className="grid grid-cols-1 gap-2">
          <MaterialRow
            label="Carcass Material"
            field="carcass_material_id"
            selectedMaterial={joineryItem.carcass_material}
            selectedMaterialId={joineryItem.carcass_material_id}
            availableMaterials={allMaterials || []}
            onMaterialChange={(materialId) => handleMaterialChange('carcass_material_id', materialId)}
            colorClass=""
          />
        </div>

        {/* Row 3: Hardware (Hinges and Drawers) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Hinge Selection */}
          <div className="p-2 bg-gray-50 rounded border">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Hinge
            </label>
            <select
              value={joineryItem.hinge_id || ''}
              onChange={(e) => handleHingeChange(e.target.value === '' ? null : e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select...</option>
              {allHardware?.map((hardware) => (
                <option key={hardware.id} value={hardware.id}>
                  {hardware.name}
                  {hardware.supplier && ` - ${hardware.supplier.name}`}
                </option>
              ))}
            </select>
            {joineryItem.hinge && (
              <div className="mt-1 text-xs text-gray-500 truncate">
                {joineryItem.hinge.supplier?.name && (
                  <span className="block truncate">{joineryItem.hinge.supplier.name}</span>
                )}
              </div>
            )}
          </div>
          {/* Drawer Hardware Selection */}
          <div className="p-2 bg-gray-50 rounded border">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Drawer Hardware
            </label>
            <select
              value={joineryItem.drawer_hardware_id || ''}
              onChange={(e) => handleDrawerHardwareChange(e.target.value === '' ? null : e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select...</option>
              {allHardware?.map((hardware) => (
                <option key={hardware.id} value={hardware.id}>
                  {hardware.name}
                  {hardware.supplier && ` - ${hardware.supplier.name}`}
                </option>
              ))}
            </select>
            {joineryItem.drawer_hardware && (
              <div className="mt-1 text-xs text-gray-500 truncate">
                {joineryItem.drawer_hardware.supplier?.name && (
                  <span className="block truncate">{joineryItem.drawer_hardware.supplier.name}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MaterialRow({
  label,
  field,
  selectedMaterial,
  selectedMaterialId,
  availableMaterials,
  onMaterialChange,
  colorClass,
}: {
  label: string
  field: 'carcass_material_id' | 'face_material_1_id' | 'face_material_2_id' | 'face_material_3_id' | 'face_material_4_id'
  selectedMaterial: Material | null | undefined
  selectedMaterialId: string | null
  availableMaterials: Material[]
  onMaterialChange: (materialId: string | null) => void
  colorClass?: string
}) {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    onMaterialChange(value === '' ? null : value)
  }

  const baseClasses = "p-2 rounded border"
  const classes = colorClass ? `${baseClasses} ${colorClass}` : `${baseClasses} bg-gray-50`

  return (
    <div className={classes}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={selectedMaterialId || ''}
        onChange={handleSelectChange}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select...</option>
        {availableMaterials.map((material) => (
          <option key={material.id} value={material.id}>
            {material.name}
            {material.supplier && ` - ${material.supplier.name}`}
          </option>
        ))}
      </select>
      {selectedMaterial && (
        <div className="mt-1 text-xs text-gray-500 truncate">
          {selectedMaterial.supplier?.name && (
            <span className="block truncate">{selectedMaterial.supplier.name}</span>
          )}
        </div>
      )}
    </div>
  )
}
