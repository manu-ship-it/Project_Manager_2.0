'use client'

import { useState, useEffect } from 'react'
import { SimpleTimeline } from '@/components/timeline/SimpleTimeline'
import { supabase } from '@/lib/supabase'
import { Project } from '@/lib/supabase'

export default function InstallSchedulePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        // Check if Supabase is configured
        if (!supabase) {
          console.warn('Supabase not configured - using empty project list')
          setProjects([])
          setIsLoading(false)
          return
        }

        console.log('Fetching projects for install schedule...')
        const { data, error } = await supabase
          .from('quote_project')
          .select('*, customer:customer(*)')
          .eq('quote', false)
          .order('install_commencement_date', { ascending: true, nullsFirst: false })
        
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6 pt-12 sm:pt-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Install Schedule</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">View and manage installation schedules</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
        <SimpleTimeline 
          projects={projects} 
          onProjectUpdate={async () => {
            // Refresh projects after update
            try {
              if (supabase) {
                const { data, error } = await supabase
                  .from('quote_project')
                  .select('*, customer:customer(*)')
                  .eq('quote', false)
                  .order('install_commencement_date', { ascending: true, nullsFirst: false })
                
                if (!error && data) {
                  setProjects(data)
                }
              }
            } catch (err) {
              console.error('Error refreshing projects:', err)
            }
          }}
        />
      </div>
    </div>
  )
}

