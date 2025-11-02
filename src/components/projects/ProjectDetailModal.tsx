'use client'

import { useState } from 'react'
import { X, Edit, Trash2, Calendar, MapPin, DollarSign, Clock, User, AlertTriangle, CheckSquare, Package, Hammer, CheckCircle } from 'lucide-react'
import { Project } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { ProjectTasksList } from '@/components/project/ProjectTasksList'
import { JoineryItemsList } from '@/components/project/JoineryItemsList'
import { MaterialsList } from '@/components/project/MaterialsList'

interface ProjectDetailModalProps {
  project: Project
  onClose: () => void
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
}

export function ProjectDetailModal({ project, onClose, onEdit, onDelete }: ProjectDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'joinery' | 'materials'>('overview')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'on_hold':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDaysUntilInstall = (installDate: string) => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const installDateObj = new Date(installDate + 'T00:00:00')
    const installStart = new Date(installDateObj.getFullYear(), installDateObj.getMonth(), installDateObj.getDate())
    
    const diffTime = installStart.getTime() - todayStart.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getUrgencyColor = (days: number) => {
    if (days > 10) return 'bg-green-100 text-green-800 border-green-200'
    if (days >= 7) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${project.project_name}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)
      
      if (error) throw error
      
      onDelete(project.id)
      onClose()
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Error deleting project. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const daysUntilInstall = project.install_commencement_date 
    ? getDaysUntilInstall(project.install_commencement_date)
    : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{project.project_name}</h2>
              <p className="text-gray-600">#{project.project_number}</p>
            </div>
            <div className="flex space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.project_status)}`}>
                {project.project_status.replace('_', ' ')}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(project.priority_level)}`}>
                {project.priority_level} priority
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              <span>Tasks ({tasks.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('joinery')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'joinery'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Joinery ({joineryItems.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'materials'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Hammer className="h-4 w-4" />
              <span>Materials ({materials.length})</span>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Client</p>
                      <p className="text-gray-600">{project.client}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Address</p>
                      <p className="text-gray-600">{project.project_address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Budget</p>
                      <p className="text-gray-600">{formatCurrency(project.overall_project_budget)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Install Duration</p>
                      <p className="text-gray-600">{project.install_duration} days</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Date Created</p>
                      <p className="text-gray-600">{formatDate(project.date_created)}</p>
                    </div>
                  </div>
                  
                  {project.install_commencement_date && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Install Date</p>
                        <p className="text-gray-600">{formatDate(project.install_commencement_date)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Status & Urgency */}
            <div className="space-y-6">
              {/* Status Indicator */}
              {project.project_status === 'completed' ? (
                <div className="p-4 rounded-lg border bg-blue-100 border-blue-200">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-800">
                        Project Complete
                      </p>
                      <p className="text-sm text-blue-600">
                        This project has been successfully completed
                      </p>
                    </div>
                  </div>
                </div>
              ) : daysUntilInstall !== null && (
                <div className={`p-4 rounded-lg border ${getUrgencyColor(daysUntilInstall)}`}>
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-6 w-6" />
                    <div>
                      <p className="font-semibold">
                        {daysUntilInstall > 0 ? `${daysUntilInstall} days until install` : 
                         daysUntilInstall === 0 ? 'Install today' : 'Install overdue'}
                      </p>
                      <p className="text-sm opacity-75">
                        {daysUntilInstall > 0 
                          ? `Installation scheduled for ${formatDate(project.install_commencement_date)}`
                          : daysUntilInstall === 0
                          ? `Installation scheduled for today (${formatDate(project.install_commencement_date)})`
                          : `Installation was scheduled for ${formatDate(project.install_commencement_date)}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Project Stats */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Status</p>
                    <p className="text-lg font-semibold text-gray-600 capitalize">
                      {project.project_status.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Priority</p>
                    <p className="text-lg font-semibold text-gray-600 capitalize">
                      {project.priority_level}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Duration</p>
                    <p className="text-lg font-semibold text-gray-600">
                      {project.install_duration} days
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Budget</p>
                    <p className="text-lg font-semibold text-gray-600">
                      {formatCurrency(project.overall_project_budget)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          ) : activeTab === 'tasks' ? (
            <div>
              <ProjectTasksList
                projectId={project.id}
              />
            </div>
          ) : activeTab === 'joinery' ? (
            <div>
              <JoineryItemsList
                projectId={project.id}
              />
            </div>
          ) : (
            <div>
              <MaterialsList
                projectId={project.id}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onEdit(project)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Project</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isDeleting ? 'Deleting...' : 'Delete Project'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

