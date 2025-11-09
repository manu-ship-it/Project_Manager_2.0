import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, ProjectTask } from '@/lib/supabase'

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as ProjectTask[]
    },
    enabled: !!projectId,
  })
}

export function useCreateProjectTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (taskData: Omit<ProjectTask, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('project_tasks')
        .insert([taskData])
        .select()
        .single()
      
      if (error) throw error
      return data as ProjectTask
    },
    onSuccess: (data) => {
      // Invalidate the specific project's tasks
      queryClient.invalidateQueries({ queryKey: ['project-tasks', data.project_id] })
      // Invalidate all project-tasks queries
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] })
      // Invalidate all-tasks queries (for the Tasks page)
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] })
    },
  })
}

export function useUpdateProjectTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectTask> & { id: string }) => {
      const { data, error } = await supabase
        .from('project_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as ProjectTask
    },
    onSuccess: (data) => {
      // Invalidate the specific project's tasks (for ProjectDetailModal, project pages, etc.)
      queryClient.invalidateQueries({ queryKey: ['project-tasks', data.project_id] })
      // Invalidate all project-tasks queries (broader invalidation)
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] })
      // Invalidate all-tasks queries (for the Tasks page)
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] })
    },
  })
}

export function useDeleteProjectTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      // First get the task to know which project it belongs to
      const { data: task, error: fetchError } = await supabase
        .from('project_tasks')
        .select('project_id')
        .eq('id', id)
        .single()
      
      if (fetchError) throw fetchError
      
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return task
    },
    onSuccess: (task) => {
      // Invalidate the specific project's tasks
      if (task) {
        queryClient.invalidateQueries({ queryKey: ['project-tasks', task.project_id] })
      }
      // Invalidate all project-tasks queries
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] })
      // Invalidate all-tasks queries (for the Tasks page)
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] })
    },
  })
}



