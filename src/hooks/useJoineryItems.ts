import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, JoineryItem } from '@/lib/supabase'

export function useJoineryItems(projectId: string) {
  return useQuery({
    queryKey: ['joinery-items', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('joinery_items')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as JoineryItem[]
    },
    enabled: !!projectId,
  })
}

export function useCreateJoineryItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (itemData: Omit<JoineryItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('joinery_items')
        .insert([itemData])
        .select()
        .single()
      
      if (error) throw error
      return data as JoineryItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['joinery-items', data.project_id] })
    },
  })
}

export function useUpdateJoineryItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JoineryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('joinery_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as JoineryItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['joinery-items', data.project_id] })
    },
  })
}

export function useDeleteJoineryItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('joinery_items')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['joinery-items'] })
    },
  })
}



