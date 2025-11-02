import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Material } from '@/lib/supabase'

export function useMaterials(projectId: string) {
  return useQuery({
    queryKey: ['materials', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Material[]
    },
    enabled: !!projectId,
  })
}

export function useCreateMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (materialData: Omit<Material, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('materials')
        .insert([materialData])
        .select()
        .single()
      
      if (error) throw error
      return data as Material
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials', data.project_id] })
    },
  })
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Material> & { id: string }) => {
      const { data, error } = await supabase
        .from('materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as Material
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materials', data.project_id] })
    },
  })
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}