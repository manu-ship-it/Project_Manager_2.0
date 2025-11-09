'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Project } from '@/lib/supabase'
import { useUpdateProject } from '@/hooks/useProjects'

interface SimpleTimelineProps {
  projects: Project[]
  onProjectUpdate?: () => void
}

export function SimpleTimeline({ projects, onProjectUpdate }: SimpleTimelineProps) {
  const [dayWidth, setDayWidth] = useState(60)
  const [localProjects, setLocalProjects] = useState<Project[]>(projects)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<{
    type: 'resize' | null
    projectId: string | null
    initialDayIndex: number
    initialDuration: number
  }>({
    type: null,
    projectId: null,
    initialDayIndex: 0,
    initialDuration: 0,
  })
  
  const timelineRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const updateProject = useUpdateProject()
  const animationFrameRef = useRef<number | null>(null)
  const lastUpdateTimeRef = useRef<number>(0)
  const lockedScrollLeftRef = useRef<number>(0)

  // Update local projects when props change
  useEffect(() => {
    setLocalProjects(projects)
  }, [projects])

  // Filter projects with install dates
  const timelineProjects = localProjects.filter(project => 
    (project.status === 'planning' || project.status === 'in_progress') &&
    project.install_commencement_date
  )

  if (timelineProjects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Timeline Data</h3>
        <p className="text-gray-500">
          No projects with install dates in planning or in progress status.
        </p>
      </div>
    )
  }

  // Get today's date
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get date range from projects
  const getDateRange = () => {
    const dates = timelineProjects.map(p => {
      const date = new Date(p.install_commencement_date!)
      date.setHours(0, 0, 0, 0)
      return date
    })
    
    const minDate = new Date(Math.min(...dates.map(d => d.getTime()), today.getTime()))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime()), today.getTime()))
    
    // Add padding
    minDate.setDate(minDate.getDate() - 3)
    maxDate.setDate(maxDate.getDate() + 3)
    
    return { start: minDate, end: maxDate }
  }

  const { start: timelineStart, end: timelineEnd } = getDateRange()

  // Generate date headers
  const dateHeaders: Date[] = []
    const current = new Date(timelineStart)
    while (current <= timelineEnd) {
    dateHeaders.push(new Date(current))
      current.setDate(current.getDate() + 1)
  }

  // Get day index for a date (simple calculation)
  const getDayIndex = useCallback((date: Date): number => {
      const dateTime = date.getTime()
      const startTime = timelineStart.getTime()
    const dayDiff = Math.round((dateTime - startTime) / (1000 * 60 * 60 * 24))
    return Math.max(0, Math.min(dateHeaders.length - 1, dayDiff))
  }, [timelineStart, dateHeaders.length])

  // Get date from day index (simple calculation)
  const getDateFromIndex = useCallback((dayIndex: number): Date => {
    const date = new Date(timelineStart)
    date.setDate(date.getDate() + dayIndex)
    date.setHours(0, 0, 0, 0)
    return date
  }, [timelineStart])

  // Format date as YYYY-MM-DD (local timezone, no timezone conversion)
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-500'
      case 'in_progress': return 'bg-green-500'
      case 'on_hold': return 'bg-yellow-500'
      case 'completed': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  // Handle project click to select
  const handleProjectClick = useCallback((e: React.MouseEvent, project: Project) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedProjectId(project.id)
  }, [])

  // Handle click outside project bars to deselect
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking on the timeline background (not on a project bar)
    const target = e.target as HTMLElement
    // Check if the click is on the timeline container or grid, not on a project bar
    if (target.closest('[data-project-bar]')) {
      return // Clicked on a project bar, don't deselect
    }
    // If clicking on the timeline background, deselect
    if (target.closest('[data-timeline-container]')) {
      setSelectedProjectId(null)
    }
  }, [])

  // Handle keyboard arrow keys to move selected project
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedProjectId) return

    const selectedProject = localProjects.find(p => p.id === selectedProjectId)
    if (!selectedProject || !selectedProject.install_commencement_date) return

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      
      const currentDate = new Date(selectedProject.install_commencement_date)
      currentDate.setHours(0, 0, 0, 0)
      const currentDayIndex = getDayIndex(currentDate)

      // Calculate new day index
      const direction = e.key === 'ArrowLeft' ? -1 : 1
      const newDayIndex = Math.max(0, Math.min(dateHeaders.length - 1, currentDayIndex + direction))

      // Only update if the day index actually changed
      if (newDayIndex !== currentDayIndex) {
        const newDate = getDateFromIndex(newDayIndex)
        const newDateStr = formatDateLocal(newDate)

        // Update optimistically
        setLocalProjects(prev => prev.map(p => 
          p.id === selectedProjectId 
            ? { ...p, install_commencement_date: newDateStr }
            : p
        ))

        // Save to database
        updateProject.mutate({
          id: selectedProjectId,
          install_commencement_date: newDateStr,
        }, {
          onSuccess: () => {
            onProjectUpdate?.()
          },
          onError: (error) => {
            console.error('Error updating project:', error)
            // Revert on error
            setLocalProjects(prev => prev.map(p => 
              p.id === selectedProjectId 
                ? { ...p, install_commencement_date: selectedProject.install_commencement_date }
                : p
            ))
          }
        })
      }
    } else if (e.key === 'Escape') {
      // Deselect on Escape
      setSelectedProjectId(null)
    }
  }, [selectedProjectId, localProjects, getDayIndex, getDateFromIndex, dateHeaders.length, updateProject, onProjectUpdate])

  // Set up keyboard event listener
  useEffect(() => {
    if (selectedProjectId) {
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [selectedProjectId, handleKeyDown])

  // Get day index from mouse X position for resize
  const getDayIndexFromMouseX = useCallback((mouseX: number): number => {
    if (!timelineRef.current || !scrollContainerRef.current) return 0
    
    const timelineRect = timelineRef.current.getBoundingClientRect()
    const scrollLeft = scrollContainerRef.current.scrollLeft
    const relativeX = mouseX - timelineRect.left + scrollLeft
    const clampedX = Math.max(0, Math.min(relativeX, dateHeaders.length * dayWidth))
    
    // Threshold-based for resize: require 60% into a day column
    const snapThreshold = dayWidth * 0.6
    const adjustedX = clampedX - snapThreshold
    const dayIndex = Math.max(0, Math.floor(Math.max(0, adjustedX) / dayWidth))
    
    return Math.max(0, Math.min(dateHeaders.length - 1, dayIndex))
  }, [dayWidth, dateHeaders.length])

  // Handle mouse down for resize only
  const handleResizeMouseDown = useCallback((e: React.MouseEvent | MouseEvent, project: Project) => {
    e.preventDefault()
    e.stopPropagation()

    const installDate = new Date(project.install_commencement_date!)
    installDate.setHours(0, 0, 0, 0)
    const startDayIndex = getDayIndex(installDate)

    setDragState({
      type: 'resize',
      projectId: project.id,
      initialDayIndex: startDayIndex,
      initialDuration: project.install_duration || 1,
    })

    // Lock the scroll position of the container
    if (scrollContainerRef.current) {
      lockedScrollLeftRef.current = scrollContainerRef.current.scrollLeft
      scrollContainerRef.current.style.overflowX = 'hidden'
      scrollContainerRef.current.style.touchAction = 'none'
    }

    // Prevent scrolling while dragging
    if (document.body) {
      document.body.style.overflow = 'hidden'
      document.body.style.userSelect = 'none'
      document.body.style.touchAction = 'none'
    }
  }, [getDayIndex])

  // Handle mouse move for resize (supports both mouse and touch)
  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragState.type || !dragState.projectId || !timelineRef.current || !scrollContainerRef.current) return

    // Get clientX from either mouse or touch event
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX
    if (!clientX) return

    // Throttle updates
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current
    const minUpdateInterval = 50

    if (timeSinceLastUpdate < minUpdateInterval) {
      return
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const targetDayIndex = getDayIndexFromMouseX(clientX)
      const currentProject = localProjects.find(p => p.id === dragState.projectId)
      if (!currentProject) return

      // For resize, calculate duration
      const endDayIndex = Math.max(dragState.initialDayIndex, targetDayIndex)
      const newDuration = Math.max(1, endDayIndex - dragState.initialDayIndex + 1)
      const currentDuration = currentProject.install_duration || 1

      // Only update if duration actually changed
      if (newDuration !== currentDuration && newDuration >= 1) {
        setLocalProjects(prev => prev.map(p => 
          p.id === dragState.projectId 
            ? { ...p, install_duration: newDuration }
            : p
        ))
        lastUpdateTimeRef.current = Date.now()
      }
    })
  }, [dragState, getDayIndexFromMouseX, localProjects])

  // Handle mouse up for resize (supports both mouse and touch)
  const handleMouseUp = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragState.type || !dragState.projectId) {
      setDragState({
        type: null,
        projectId: null,
        initialDayIndex: 0,
        initialDuration: 0,
      })
      return
    }

    // Get clientX from either mouse or touch event
    const clientX = 'touches' in e ? (e.changedTouches[0]?.clientX ?? 0) : e.clientX
    const targetDayIndex = getDayIndexFromMouseX(clientX)
    const project = localProjects.find(p => p.id === dragState.projectId)
    if (!project) {
      setDragState({
        type: null,
        projectId: null,
        initialDayIndex: 0,
        initialDuration: 0,
      })
      return
    }

    // For resize, calculate final duration
    const endDayIndex = Math.max(dragState.initialDayIndex, targetDayIndex)
    const newDuration = Math.max(1, endDayIndex - dragState.initialDayIndex + 1)

    // Only update if duration actually changed
    if (newDuration !== dragState.initialDuration) {
        updateProject.mutate({
          id: dragState.projectId,
          install_duration: newDuration,
        }, {
          onSuccess: () => {
            onProjectUpdate?.()
          },
          onError: (error) => {
            console.error('Error updating project:', error)
          setLocalProjects(prev => prev.map(p => 
            p.id === dragState.projectId 
              ? { ...p, install_duration: dragState.initialDuration }
              : p
          ))
          }
        })
    }

    // Reset drag state
    setDragState({
      type: null,
      projectId: null,
      initialDayIndex: 0,
      initialDuration: 0,
    })

    // Re-enable scrolling after drag ends
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.overflowX = ''
      scrollContainerRef.current.style.touchAction = ''
    }

    if (document.body) {
      document.body.style.overflow = ''
      document.body.style.userSelect = ''
      document.body.style.touchAction = ''
    }
  }, [dragState, getDayIndexFromMouseX, localProjects, updateProject, onProjectUpdate])

  // Set up global mouse and touch event listeners for resize
  useEffect(() => {
    if (dragState.type) {
      window.addEventListener('mousemove', handleMouseMove as EventListener)
      window.addEventListener('mouseup', handleMouseUp as EventListener)
      window.addEventListener('touchmove', handleMouseMove as EventListener, { passive: false })
      window.addEventListener('touchend', handleMouseUp as EventListener)
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove as EventListener)
        window.removeEventListener('mouseup', handleMouseUp as EventListener)
        window.removeEventListener('touchmove', handleMouseMove as EventListener)
        window.removeEventListener('touchend', handleMouseUp as EventListener)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (scrollContainerRef.current) {
          scrollContainerRef.current.style.overflowX = ''
          scrollContainerRef.current.style.touchAction = ''
        }
        if (document.body) {
          document.body.style.overflow = ''
          document.body.style.userSelect = ''
          document.body.style.touchAction = ''
        }
      }
    }
  }, [dragState.type, handleMouseMove, handleMouseUp])

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-3 sm:p-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-2">
          <div className="flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Project Install Timeline</h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Showing {timelineProjects.length} project{timelineProjects.length !== 1 ? 's' : ''} with scheduled installs
            </p>
            {selectedProjectId && (
              <p className="text-xs text-blue-600 mt-1">
                <span className="hidden sm:inline">Project selected. Use ← → arrow keys to move. Drag right edge to resize duration.</span>
                <span className="sm:hidden">Selected. Tap to move. Drag edge to resize.</span>
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <label className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">
              Day Width: <span className="font-medium">{dayWidth}px</span>
            </label>
            <input
              type="range"
              min="30"
              max="100"
              value={dayWidth}
              onChange={(e) => setDayWidth(Number(e.target.value))}
              className="w-full sm:w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((dayWidth - 30) / 70) * 100}%, #e5e7eb ${((dayWidth - 30) / 70) * 100}%, #e5e7eb 100%)`
              }}
            />
          </div>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto -mx-4 sm:mx-0"
        data-timeline-container
        onClick={handleTimelineClick}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div style={{ minWidth: `${160 + (dateHeaders.length * dayWidth)}px` }}>
          {/* Date Headers */}
          <div className="flex border-b sticky top-0 z-30 bg-white">
            <div className="w-32 sm:w-48 p-2 sm:p-3 border-r bg-gray-50 flex-shrink-0">
              <span className="text-xs sm:text-sm font-medium text-gray-700">Project</span>
            </div>
            <div className="flex" style={{ width: `${dateHeaders.length * dayWidth}px` }}>
              {dateHeaders.map((date, index) => {
                const isToday = date.toDateString() === today.toDateString()
                const isFirstOfMonth = date.getDate() === 1
                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                
                return (
                  <div
                    key={index}
                    className={`text-center text-[10px] sm:text-xs py-1 sm:py-2 border-r border-gray-200 flex flex-col items-center justify-center ${
                      isToday 
                        ? 'bg-red-100 text-red-800 font-semibold' 
                        : isWeekend
                        ? 'bg-gray-50 text-gray-500'
                        : 'bg-gray-50'
                    }`}
                    style={{ 
                      width: `${dayWidth}px`,
                      flexShrink: 0,
                      minHeight: '40px'
                    }}
                    title={date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  >
                    {isFirstOfMonth && (
                      <span className="text-[9px] sm:text-[10px] font-semibold text-gray-600 mb-0.5">
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    )}
                    <span className={isToday ? 'font-bold' : ''}>{date.getDate()}</span>
                    {isToday && (
                      <span className="text-[8px] text-red-600 font-medium mt-0.5">Today</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Project Rows */}
          <div className="divide-y">
            {timelineProjects.map((project) => {
              const installDate = new Date(project.install_commencement_date!)
              installDate.setHours(0, 0, 0, 0)
              
              const duration = project.install_duration || 1
              const endDate = new Date(installDate)
              endDate.setDate(endDate.getDate() + duration - 1)
              endDate.setHours(0, 0, 0, 0)
              
              const startDayIndex = getDayIndex(installDate)
              const barStartPosition = startDayIndex * dayWidth
              const barWidth = duration * dayWidth
              const todayIndex = getDayIndex(today)
              const todayPosition = todayIndex * dayWidth
              const isSelected = selectedProjectId === project.id
              const isResizing = dragState.projectId === project.id && dragState.type === 'resize'

              return (
                <div key={project.id} className="flex items-center py-2 sm:py-3">
                  {/* Project Name */}
                  <div className="w-32 sm:w-48 p-2 sm:p-3 border-r flex-shrink-0">
                    <div className="text-xs sm:text-sm font-medium text-gray-900 truncate" title={project.name}>
                      {project.name}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 truncate" title={project.customer?.company_name || ''}>
                      {project.customer?.company_name || ''}
                    </div>
                    <div className="text-[9px] sm:text-xs text-gray-400 mt-0.5 hidden sm:block">
                      {duration}d
                    </div>
                  </div>

                  {/* Timeline */}
                  <div 
                    ref={timelineRef}
                    className="relative" 
                    style={{ width: `${dateHeaders.length * dayWidth}px` }}
                  >
                    <div className="relative h-full w-full">
                      {/* Grid structure matching header columns exactly */}
                      <div className="absolute inset-0 flex">
                        {dateHeaders.map((date, index) => (
                          <div
                            key={index}
                            className="border-r border-gray-200"
                            style={{ 
                              width: `${dayWidth}px`,
                              flexShrink: 0
                            }}
                          />
                        ))}
                      </div>
                      
                      {/* Today line */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" 
                        style={{ left: `${todayPosition}px` }}
                        title="Today"
                      />
                      
                      {/* Project Bar */}
                      <div 
                        data-project-bar
                        className={`absolute top-1/2 transform -translate-y-1/2 h-6 sm:h-7 rounded ${getStatusColor(project.status || 'planning')} opacity-80 hover:opacity-100 transition-opacity cursor-pointer border-2 touch-none ${
                          isSelected 
                            ? 'border-blue-500 border-4 opacity-100 z-20 shadow-lg ring-2 ring-blue-300' 
                            : isResizing
                            ? 'border-white opacity-100 z-20 shadow-lg'
                            : 'border-white'
                        }`}
                        style={{ 
                          left: `${barStartPosition}px`,
                          width: `${barWidth}px`,
                          minWidth: '24px'
                        }}
                        onClick={(e) => handleProjectClick(e, project)}
                        title={`${project.name} - ${duration} day${duration !== 1 ? 's' : ''} install (${installDate.toLocaleDateString()} to ${endDate.toLocaleDateString()})${isSelected ? ' - Selected (use arrow keys to move)' : ''}`}
                      >
                        <div className="h-full flex items-center justify-center text-white text-[10px] sm:text-xs font-medium px-1">
                          <span className="hidden sm:inline">{duration}d</span>
                          <span className="sm:hidden">{duration}</span>
                        </div>
                        {/* Resize handle - only for resizing duration */}
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-4 sm:w-3 cursor-ew-resize bg-white bg-opacity-50 hover:bg-opacity-70 active:bg-opacity-90 rounded-r border-l-2 border-white border-opacity-50 touch-manipulation"
                          title="Drag right edge to resize duration"
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            handleResizeMouseDown(e, project)
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleResizeMouseDown(e as any, project)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
