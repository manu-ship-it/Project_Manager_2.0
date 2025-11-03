'use client'

import { useState } from 'react'
import { Plus, User, Phone, Mail, Trash2, X } from 'lucide-react'
import { useInstallers, useAssignProjectInstaller, useRemoveProjectInstaller, useProjectInstallers } from '@/hooks/useInstallers'
import { ProjectInstaller } from '@/lib/supabase'

interface InstallerAssignmentProps {
  projectId: string
}

export function InstallerAssignment({ projectId }: InstallerAssignmentProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const { data: installers = [], isLoading: installersLoading } = useInstallers()
  const { data: projectInstallers = [], isLoading: projectInstallersLoading } = useProjectInstallers(projectId)

  if (installersLoading || projectInstallersLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const assignedInstallers = (projectInstallers || []).map((pi: ProjectInstaller) => 
    (installers || []).find(installer => installer.id === pi.installer_id)
  ).filter((installer): installer is NonNullable<typeof installer> => installer !== undefined)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Assigned Installers</h3>
          <p className="text-sm text-gray-600">Manage installer assignments for this project</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Assign Installer</span>
        </button>
      </div>

      {/* Assigned Installers */}
      {assignedInstallers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedInstallers.map((installer) => (
            <InstallerCard
              key={installer.id}
              installer={installer}
              projectId={projectId}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <User className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No installers assigned</h3>
          <p className="text-gray-500 mb-4">Assign an installer to this project.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Assign First Installer</span>
          </button>
        </div>
      )}

      {/* Add Installer Modal */}
      {showAddForm && (
        <AddInstallerModal
          projectId={projectId}
          assignedInstallerIds={assignedInstallers.map(i => i.id)}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}

function InstallerCard({ installer, projectId }: { installer: any, projectId: string }) {
  const removeInstaller = useRemoveProjectInstaller()

  const handleRemove = async () => {
    if (confirm('Are you sure you want to remove this installer from the project?')) {
      await removeInstaller.mutateAsync({ projectId, installerId: installer.id })
    }
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900">{installer.name}</h4>
          {installer.contact_info && (
            <div className="mt-2 space-y-1">
              {installer.contact_info.split(',').map((info: string, index: number) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                  {info.includes('@') ? (
                    <>
                      <Mail className="h-4 w-4" />
                      <span>{info.trim()}</span>
                    </>
                  ) : (
                    <>
                      <Phone className="h-4 w-4" />
                      <span>{info.trim()}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="text-red-600 hover:text-red-800 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function AddInstallerModal({ projectId, assignedInstallerIds, onClose, onSuccess }: any) {
  const [selectedInstallerId, setSelectedInstallerId] = useState('')
  const assignInstaller = useAssignProjectInstaller()
  const { data: installers } = useInstallers()

  const handleSubmit = async () => {
    if (!selectedInstallerId) return

    try {
      await assignInstaller.mutateAsync({ projectId, installerId: selectedInstallerId })
      onSuccess()
    } catch (error) {
      console.error('Error assigning installer:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Assign Installer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Installer
            </label>
            <select
              value={selectedInstallerId}
              onChange={(e) => setSelectedInstallerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose an installer...</option>
              {installers?.filter(i => !assignedInstallerIds.includes(i.id)).map((installer) => (
                <option key={installer.id} value={installer.id}>
                  {installer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedInstallerId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Assign Installer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
