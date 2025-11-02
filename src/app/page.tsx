'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { ProjectDetailModal } from '@/components/projects/ProjectDetailModal'
import { supabase } from '@/lib/supabase'
import { Project } from '@/lib/supabase'

export default function Dashboard() {
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showProjectDetail, setShowProjectDetail] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        console.log('Fetching projects...')
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })
        
        console.log('Projects fetch result:', { data, error })
        
        if (error) {
          console.error('Error fetching projects:', error)
          setError(error.message)
        } else {
          setProjects(data || [])
        }
      } catch (err) {
        console.error('Error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.project_number.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || project.project_status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Sort projects by status priority
  const sortedProjects = filteredProjects.sort((a, b) => {
    const statusOrder = { 'in_progress': 1, 'planning': 2, 'completed': 3, 'on_hold': 4 }
    const aOrder = statusOrder[a.project_status] || 5
    const bOrder = statusOrder[b.project_status] || 5
    
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

  // Handle project card click
  const handleProjectClick = (project: Project) => {
    setSelectedProject(project)
    setShowProjectDetail(true)
  }

  // Handle edit project
  const handleEditProject = (project: Project) => {
    setSelectedProject(project)
    setShowProjectDetail(false)
    setShowProjectForm(true)
  }

  // Handle delete project
  const handleDeleteProject = (projectId: string) => {
    setProjects(projects.filter(p => p.id !== projectId))
    setShowProjectDetail(false)
    setSelectedProject(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Projects</h2>
          <p className="text-gray-600">Please check your connection and try again.</p>
          <p className="text-sm text-gray-500 mt-2">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Custom Joinery Project Manager</h1>
              <p className="text-gray-600 mt-1">Manage your joinery projects and installations</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowProjectForm(true)}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Project</span>
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
              const status = project.project_status
              if (!groups[status]) {
                groups[status] = []
              }
              groups[status].push(project)
              return groups
            }, {} as Record<string, typeof sortedProjects>)

            const statusLabels = {
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
                    {statusLabels[status as keyof typeof statusLabels]}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({projectsInStatus.length} project{projectsInStatus.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
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
                            daysUntilInstall={project.project_status === 'completed' ? null : daysUntilInstall}
                            urgencyColor={project.project_status === 'completed' ? '' : (daysUntilInstall ? getUrgencyColor(daysUntilInstall) : '')}
                            onEdit={handleEditProject}
                          />
                        </div>
                      )
                    })}
                  </div>
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
    </div>
  )
}
