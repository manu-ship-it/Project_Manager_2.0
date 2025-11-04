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
      queryClient.invalidateQueries({ queryKey: ['project-tasks', data.project_id] })
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
      queryClient.invalidateQueries({ queryKey: ['project-tasks', data.project_id] })
    },
  })
}

export function useDeleteProjectTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] })
    },
  })
}



