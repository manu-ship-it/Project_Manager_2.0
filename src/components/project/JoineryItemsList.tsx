'use client'

import { useState } from 'react'
import { Plus, Check, X, Calendar, DollarSign, Edit } from 'lucide-react'
import { useJoineryItems, useUpdateJoineryItem } from '@/hooks/useJoineryItems'
import { JoineryItemForm } from './JoineryItemForm'
import { JoineryItemMaterials } from './JoineryItemMaterials'
import { JoineryItemCabinets } from './JoineryItemCabinets'
import { JoineryItem } from '@/lib/supabase'

interface JoineryItemsListProps {
  projectId: string // This is actually quote_proj_id now
}

export function JoineryItemsList({ projectId }: JoineryItemsListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<JoineryItem | null>(null)
  const { data: items, isLoading } = useJoineryItems(projectId)
  const updateJoineryItem = useUpdateJoineryItem()

  const handleChecklistToggle = async (itemId: string, checklistKey: string, currentValue: boolean) => {
    try {
      await updateJoineryItem.mutateAsync({
        id: itemId,
        [checklistKey]: !currentValue,
      })
    } catch (error: any) {
      console.error('Error updating checklist:', error)
      alert(`Error updating checklist: ${error?.message || 'Unknown error'}`)
    }
  }

  const checklistItems = [
    { key: 'shop_drawings_approved', label: 'Shop Drawings Approved' },
    { key: 'board_ordered', label: 'Board Ordered' },
    { key: 'hardware_ordered', label: 'Hardware Ordered' },
    { key: 'site_measured', label: 'Site Measured' },
    { key: 'microvellum_ready_to_process', label: 'Microvellum Ready to Process' },
    { key: 'processed_to_factory', label: 'Processed to Factory' },
    { key: 'picked_up_from_factory', label: 'Picked up from Factory' },
    { key: 'install_scheduled', label: 'Install Scheduled' },
    { key: 'plans_printed', label: 'Plans Printed' },
    { key: 'assembled', label: 'Assembled' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'installed', label: 'Installed' },
    { key: 'invoiced', label: 'Invoiced' },
  ]

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
          <h3 className="text-lg font-semibold text-gray-900">Joinery Items</h3>
          <p className="text-sm text-gray-600">Manage joinery items and track their progress</p>
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
      {items && items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">{item.name}</h4>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Budget: ${(item.budget || 0).toLocaleString()}
                      </span>
                    </div>
                    {item.install_commencement_date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Install: {new Date(item.install_commencement_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {item.install_duration && item.install_duration > 0 && (
                      <span className="text-sm text-gray-600">
                        Duration: {item.install_duration} days
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEditingItem(item)}
                  className="ml-4 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit item"
                >
                  <Edit className="h-5 w-5" />
                </button>
              </div>

              {/* Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {checklistItems.map((checklistItem) => {
                  const isChecked = item[checklistItem.key as keyof typeof item] as boolean
                  return (
                    <button
                      key={checklistItem.key}
                      onClick={() => handleChecklistToggle(item.id, checklistItem.key, isChecked)}
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left w-full"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isChecked
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300'
                      }`}>
                        {isChecked && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <span className={`text-sm ${
                        isChecked
                          ? 'text-green-700 font-medium' 
                          : 'text-gray-600'
                      }`}>
                        {checklistItem.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Materials Section */}
              <JoineryItemMaterials joineryItemId={item.id} />

              {/* Cabinets Section */}
              <JoineryItemCabinets joineryItemId={item.id} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
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

      {/* Form Modal */}
      {showForm && (
        <JoineryItemForm
          projectId={projectId}
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {/* Edit Modal */}
      {editingItem && (
        <JoineryItemForm
          projectId={projectId}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}



