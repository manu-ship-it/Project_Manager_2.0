'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, Package, Ruler, Hash, Building } from 'lucide-react'
import { useMaterials, useDeleteMaterial } from '@/hooks/useMaterials'
import { MaterialForm } from './MaterialForm'
import { Material } from '@/lib/supabase'

interface MaterialsListProps {
  projectId: string
}

export function MaterialsList({ projectId }: MaterialsListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const { data: materials, isLoading } = useMaterials(projectId)
  const deleteMaterial = useDeleteMaterial()

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    setShowForm(true)
  }

  const handleDelete = async (material: Material) => {
    if (confirm(`Are you sure you want to delete "${material.material_name}"?`)) {
      await deleteMaterial.mutateAsync(material.id)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingMaterial(null)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingMaterial(null)
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
          <h3 className="text-lg font-semibold text-gray-900">Materials & Supplies</h3>
          <p className="text-sm text-gray-600">Manage project materials and track inventory</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Material</span>
        </button>
      </div>

      {/* Materials List */}
      {materials && materials.length > 0 ? (
        <div className="space-y-4">
          {materials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Package className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No materials yet</h3>
          <p className="text-gray-500 mb-4">Add your first material to get started.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add First Material</span>
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <MaterialForm
          projectId={projectId}
          material={editingMaterial || undefined}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}

function MaterialCard({ 
  material, 
  onEdit, 
  onDelete 
}: { 
  material: Material
  onEdit: (material: Material) => void
  onDelete: (material: Material) => void
}) {
  return (
    <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {material.material_name}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Quantity */}
            <div className="flex items-center space-x-2">
              <Hash className="h-4 w-4 text-gray-400" />
              <div>
                <span className="text-sm text-gray-600">Quantity:</span>
                <p className="font-medium text-gray-900">{material.quantity}</p>
              </div>
            </div>

            {/* Thickness */}
            {material.thickness && (
              <div className="flex items-center space-x-2">
                <Ruler className="h-4 w-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600">Thickness:</span>
                  <p className="font-medium text-gray-900">{material.thickness}mm</p>
                </div>
              </div>
            )}

            {/* Board Size */}
            {material.board_size && (
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600">Size:</span>
                  <p className="font-medium text-gray-900">{material.board_size}</p>
                </div>
              </div>
            )}

            {/* Supplier */}
            {material.supplier && (
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600">Supplier:</span>
                  <p className="font-medium text-gray-900">{material.supplier}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => onEdit(material)}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit material"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(material)}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="Delete material"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}