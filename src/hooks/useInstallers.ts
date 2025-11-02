import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Installer } from '@/lib/supabase'

export function useInstallers() {
  return useQuery({
    queryKey: ['installers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('installers')
        .select('*')
        .order('name', { ascending: true })
      
      if (error) throw error
      return data as Installer[]
    },
  })
}

export function useProjectInstallers(projectId: string) {
  return useQuery({
    queryKey: ['project-installers', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_installers')
        .select('*')
        .eq('project_id', projectId)
      
      if (error) throw error
      return data
    },
    enabled: !!projectId,
  })
}

export function useAssignProjectInstaller() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ projectId, installerId }: { projectId: string, installerId: string }) => {
      const { data, error } = await supabase
        .from('project_installers')
        .insert([{ project_id: projectId, installer_id: installerId }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-installers', data.project_id] })
    },
  })
}

export function useRemoveProjectInstaller() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ projectId, installerId }: { projectId: string, installerId: string }) => {
      const { error } = await supabase
        .from('project_installers')
        .delete()
        .eq('project_id', projectId)
        .eq('installer_id', installerId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-installers'] })
    },
  })
}


