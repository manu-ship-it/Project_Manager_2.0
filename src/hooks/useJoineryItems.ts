import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, JoineryItem } from '@/lib/supabase'

// Get joinery items for a quote_project (unified for quotes and projects)
export function useJoineryItems(quoteProjectId: string) {
  return useQuery({
    queryKey: ['joinery-items', quoteProjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('joinery_item')
        .select(`
          *,
          quote_project:quote_project(*)
        `)
        .eq('quote_proj_id', quoteProjectId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as JoineryItem[]
    },
    enabled: !!quoteProjectId,
  })
}

// Get joinery items filtered by quote boolean
export function useJoineryItemsByType(quoteProjectId: string, isQuote: boolean) {
  return useQuery({
    queryKey: ['joinery-items', quoteProjectId, isQuote ? 'quote' : 'project'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('joinery_item')
        .select(`
          *,
          quote_project:quote_project(*)
        `)
        .eq('quote_proj_id', quoteProjectId)
        .eq('quote', isQuote)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as JoineryItem[]
    },
    enabled: !!quoteProjectId,
  })
}

export function useCreateJoineryItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (itemData: Omit<JoineryItem, 'id' | 'created_at' | 'updated_at' | 'quote_project'>) => {
      // Remove undefined fields to avoid sending them to Supabase
      const cleanData = Object.fromEntries(
        Object.entries(itemData).filter(([_, value]) => value !== undefined)
      )
      
      const { data, error } = await supabase
        .from('joinery_item')
        .insert([cleanData])
        .select(`
          *,
          quote_project:quote_project(*)
        `)
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      return data as JoineryItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['joinery-items', data.quote_proj_id] })
    },
  })
}

export function useUpdateJoineryItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JoineryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('joinery_item')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          quote_project:quote_project(*)
        `)
        .single()
      
      if (error) throw error
      return data as JoineryItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['joinery-items', data.quote_proj_id] })
    },
  })
}

export function useDeleteJoineryItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, quote_proj_id }: { id: string; quote_proj_id: string }) => {
      const { error } = await supabase
        .from('joinery_item')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { id, quote_proj_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['joinery-items', data.quote_proj_id] })
    },
  })
}



