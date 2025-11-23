'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Plus, Phone, Calendar, DollarSign, User, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'
import { useQuoteProject } from '@/hooks/useQuoteProjects'
import { JoineryItemsList } from '@/components/project/JoineryItemsList'
import { ProjectTasksList } from '@/components/project/ProjectTasksList'
import { InstallerAssignment } from '@/components/project/InstallerAssignment'
import { format } from 'date-fns'

export default function ProjectDetailsPage() {
  const params = useParams()
  const projectId = params.id as string
  const { data: project, isLoading, error } = useQuoteProject(projectId)
  const [activeTab, setActiveTab] = useState<'overview' | 'joinery' | 'tasks' | 'installer'>('overview')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    )
  }

  const getDaysUntilInstall = (installDate: string) => {
    const today = new Date()
    const install = new Date(installDate)
    const diffTime = install.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getUrgencyColor = (days: number) => {
    if (days > 10) return 'bg-green-100 text-green-800 border-green-200'
    if (days >= 7) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'on_hold': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const daysUntilInstall = project.install_commencement_date 
    ? getDaysUntilInstall(project.install_commencement_date)
    : null

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-6 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-3 pt-12 sm:pt-0">
              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Back to Projects</span>
              </Link>
              <div className="hidden sm:block h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-sm sm:text-base text-gray-600">#{project.proj_num || '-'} • {project.customer?.company_name || '-'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">Voice Agent</span>
                <span className="sm:hidden">Voice</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border mt-4 sm:mt-6">
          <div className="border-b">
            <nav className="flex space-x-2 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'joinery', label: 'Joinery Items' },
                { id: 'tasks', label: 'Tasks' },
                { id: 'installer', label: 'Installer' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Project Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Budget</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${(project.budget || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Install Date</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {project.install_commencement_date 
                        ? format(new Date(project.install_commencement_date), 'MMM dd, yyyy')
                        : 'Not set'
                      }
                    </p>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Duration</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {project.install_duration || 0} days
                    </p>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Status</span>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status || '')}`}>
                      {(project.status || '').replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Days Until Install */}
                {daysUntilInstall !== null && (
                  <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Installation Countdown</h3>
                        <p className="text-gray-600">Days remaining until installation begins</p>
                      </div>
                      <div className={`px-4 py-2 rounded-lg border text-lg font-bold ${getUrgencyColor(daysUntilInstall)}`}>
                        {daysUntilInstall > 0 ? `${daysUntilInstall} days` : 'Overdue'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Project Number:</span>
                        <p className="text-gray-900">#{project.proj_num || '-'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Customer:</span>
                        <p className="text-gray-900">{project.customer?.company_name || '-'}</p>
                      </div>
                      {project.priority_level && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Priority:</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ml-2 ${getPriorityColor(project.priority_level)}`}>
                            {project.priority_level}
                          </span>
                        </div>
                      )}
                      {project.address && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Address:</span>
                          <p className="text-gray-900">{project.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Created:</span>
                        <p className="text-gray-900">{format(new Date(project.created_at), 'MMM dd, yyyy')}</p>
                      </div>
                      {project.install_commencement_date && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Install Start:</span>
                          <p className="text-gray-900">{format(new Date(project.install_commencement_date), 'MMM dd, yyyy')}</p>
                        </div>
                      )}
                      {project.install_duration && project.install_duration > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Install Duration:</span>
                          <p className="text-gray-900">{project.install_duration} days</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'joinery' && <JoineryItemsList projectId={projectId} />}
            {activeTab === 'tasks' && <ProjectTasksList projectId={projectId} />}
            {activeTab === 'installer' && <InstallerAssignment projectId={projectId} />}
          </div>
        </div>
      </div>
    </div>
  )
}



