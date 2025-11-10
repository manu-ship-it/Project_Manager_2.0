'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Mic, LayoutGrid, List } from 'lucide-react'
import { ProjectCard, ProjectForm, ProjectDetailModal } from '@/components/projects'
import { VoiceAssistant } from '@/components/voice/VoiceAssistant'
import { QuoteProject } from '@/lib/supabase'
import { useProjects, useUpdateQuoteProject } from '@/hooks/useQuoteProjects'

export default function Dashboard() {
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showProjectDetail, setShowProjectDetail] = useState(false)
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false)
  const [selectedProject, setSelectedProject] = useState<QuoteProject | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { data: projects = [], isLoading, error: queryError } = useProjects()
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const updateProject = useUpdateQuoteProject()

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Unknown error') : null

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const customerName = project.customer?.company_name || ''
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.proj_num || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Sort projects by status priority
  const sortedProjects = filteredProjects.sort((a, b) => {
    const statusOrder: Record<string, number> = { 'in_progress': 1, 'planning': 2, 'completed': 3, 'on_hold': 4 }
    const aOrder = statusOrder[a.status || ''] || 5
    const bOrder = statusOrder[b.status || ''] || 5
    
    if (aOrder !== bOrder) {
      return aOrder - bOrder
    }
    
    // Within same status, sort by install date (earliest first)
    if (a.install_commencement_date && b.install_commencement_date) {
      return new Date(a.install_commencement_date).getTime() - new Date(b.install_commencement_date).getTime()
    }
    
    // If no install dates, sort by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'on_hold': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Handle project card click
  const handleProjectClick = (project: QuoteProject) => {
    setSelectedProject(project)
    setShowProjectDetail(true)
  }

  // Handle edit project
  const handleEditProject = (project: QuoteProject) => {
    setSelectedProject(project)
    setShowProjectDetail(false)
    setShowProjectForm(true)
  }

  // Handle delete project
  const handleDeleteProject = (projectId: string) => {
    setShowProjectDetail(false)
    setSelectedProject(null)
  }

  // Handle update project
  const handleUpdateProject = async (id: string, updates: Partial<QuoteProject>) => {
    try {
      await updateProject.mutateAsync({ id, ...updates })
    } catch (error) {
      console.error('Error updating project:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Projects</h2>
          <p className="text-gray-600">Please check your connection and try again.</p>
          <p className="text-sm text-gray-500 mt-2">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 gap-4">
            <div className="pt-12 sm:pt-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Projects</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your joinery projects and installations</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                <button
                  onClick={() => setViewMode('card')}
                  className={`flex items-center space-x-1 px-2 sm:px-3 py-2 transition-colors ${
                    viewMode === 'card'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">Cards</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center space-x-1 px-2 sm:px-3 py-2 transition-colors border-l border-gray-300 ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  title="List View"
                >
                  <List className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">List</span>
                </button>
              </div>
              <button
                onClick={() => setShowVoiceAssistant(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
              >
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Talk to Assistant</span>
                <span className="sm:hidden">Assistant</span>
              </button>
              <button
                onClick={() => setShowProjectForm(true)}
                className="flex items-center space-x-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Project</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search projects, clients, or project numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="space-y-8">
          {(() => {
            // Group projects by status
            const groupedProjects = sortedProjects.reduce((groups, project) => {
              const status = project.status || 'unknown'
              if (!groups[status]) {
                groups[status] = []
              }
              groups[status].push(project)
              return groups
            }, {} as Record<string, typeof sortedProjects>)

            const statusLabels: Record<string, string> = {
              'in_progress': 'In Progress',
              'planning': 'Planning',
              'completed': 'Completed',
              'on_hold': 'On Hold'
            }

            const statusOrder = ['in_progress', 'planning', 'completed', 'on_hold']

            return statusOrder.map(status => {
              const projectsInStatus = groupedProjects[status] || []
              if (projectsInStatus.length === 0) return null

              return (
                <div key={status}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    {statusLabels[status] || status}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({projectsInStatus.length} project{projectsInStatus.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
                  {viewMode === 'card' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {projectsInStatus.map((project) => {
                        const daysUntilInstall = project.install_commencement_date 
                          ? getDaysUntilInstall(project.install_commencement_date)
                          : null
                        
                        return (
                          <div
                            key={project.id}
                            onClick={() => handleProjectClick(project)}
                            className="cursor-pointer"
                          >
                            <ProjectCard
                              project={project}
                              daysUntilInstall={project.status === 'completed' ? null : daysUntilInstall}
                              urgencyColor={project.status === 'completed' ? '' : (daysUntilInstall ? getUrgencyColor(daysUntilInstall) : '')}
                              onEdit={handleEditProject}
                              onUpdate={handleUpdateProject}
                            />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <div className="inline-block min-w-full align-middle">
                          <div className="overflow-hidden sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project #</th>
                                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Project Name</th>
                                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Until Install</th>
                                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Install Date</th>
                                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Budget</th>
                                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Address</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {projectsInStatus.map((project) => {
                                  const daysUntilInstall = project.install_commencement_date 
                                    ? getDaysUntilInstall(project.install_commencement_date)
                                    : null
                                  
                                  return (
                                    <tr
                                      key={project.id}
                                      onClick={() => handleProjectClick(project)}
                                      className="cursor-pointer hover:bg-blue-50 hover:shadow-sm transition-all duration-150"
                                    >
                                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {project.proj_num || '-'}
                                      </td>
                                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <div>{project.customer?.company_name || '-'}</div>
                                        <div className="sm:hidden text-xs text-gray-500 mt-1">{project.name}</div>
                                      </td>
                                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                                        {project.name}
                                      </td>
                                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                        {project.status === 'completed' ? (
                                          <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                                            Complete
                                          </span>
                                        ) : daysUntilInstall !== null ? (
                                          <span className={`px-2 py-1 text-xs font-medium rounded ${getUrgencyColor(daysUntilInstall)}`}>
                                            {daysUntilInstall > 0 ? `${daysUntilInstall} days` : 
                                             daysUntilInstall === 0 ? 'Today' : 'Overdue'}
                                          </span>
                                        ) : (
                                          <span className="text-sm text-gray-400">-</span>
                                        )}
                                      </td>
                                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                        <select
                                          value={project.status || ''}
                                          onChange={(e) => {
                                            handleUpdateProject(project.id, { status: e.target.value })
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className={`px-2 py-1 text-xs font-medium rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${getStatusColor(project.status || '')}`}
                                        >
                                          <option value="planning">Planning</option>
                                          <option value="in_progress">In Progress</option>
                                          <option value="completed">Completed</option>
                                          <option value="on_hold">On Hold</option>
                                        </select>
                                      </td>
                                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                        <input
                                          type="date"
                                          value={project.install_commencement_date ? new Date(project.install_commencement_date).toISOString().split('T')[0] : ''}
                                          onChange={(e) => {
                                            handleUpdateProject(project.id, { install_commencement_date: e.target.value || null })
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                        />
                                      </td>
                                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                                        ${(project.budget || 0).toLocaleString()}
                                      </td>
                                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-600 max-w-xs truncate hidden lg:table-cell">
                                        {project.address || '-'}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          })()}
        </div>

        {sortedProjects.length === 0 && projects.length > 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects match your filters</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}

        {projects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first project.
            </p>
            <button
              onClick={() => setShowProjectForm(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Project</span>
            </button>
          </div>
        )}
      </div>

      {/* Project Form Modal */}
      {showProjectForm && (
        <ProjectForm
          project={selectedProject || undefined}
          onClose={() => {
            setShowProjectForm(false)
            setSelectedProject(null)
          }}
          onSuccess={() => {
            setShowProjectForm(false)
            setSelectedProject(null)
            // Refresh projects after creating/editing
            window.location.reload()
          }}
        />
      )}

      {/* Project Detail Modal */}
      {showProjectDetail && selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => {
            setShowProjectDetail(false)
            setSelectedProject(null)
          }}
          onEdit={handleEditProject}
          onDelete={handleDeleteProject}
        />
      )}

      {/* Voice Assistant Modal */}
      {showVoiceAssistant && (
        <VoiceAssistant
          onClose={() => setShowVoiceAssistant(false)}
          onProjectUpdate={async () => {
              // Projects will auto-refresh via React Query
          }}
        />
      )}
    </div>
  )
}
