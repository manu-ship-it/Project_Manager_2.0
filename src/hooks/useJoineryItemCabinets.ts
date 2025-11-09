import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, JoineryItemCabinet } from '@/lib/supabase'

// Get cabinets for a specific joinery item
export function useJoineryItemCabinets(joineryItemId: string) {
  return useQuery({
    queryKey: ['joinery-item-cabinets', joineryItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('joinery_item_cabinets')
        .select(`
          *,
          standard_cabinet:standard_cabinets(*)
        `)
        .eq('joinery_item_id', joineryItemId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as JoineryItemCabinet[]
    },
    enabled: !!joineryItemId,
  })
}

// Add a cabinet to a joinery item
export function useAddJoineryItemCabinet() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      joinery_item_id: string
      standard_cabinet_id: string
      quantity: number
      custom_width?: number | null
      custom_height?: number | null
      custom_depth?: number | null
      notes?: string | null
    }) => {
      const { data: result, error } = await supabase
        .from('joinery_item_cabinets')
        .insert([data])
        .select(`
          *,
          standard_cabinet:standard_cabinets(*)
        `)
        .single()
      
      if (error) throw error
      return result as JoineryItemCabinet
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['joinery-item-cabinets', data.joinery_item_id] })
    },
  })
}

// Update a cabinet in a joinery item
export function useUpdateJoineryItemCabinet() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JoineryItemCabinet> & { id: string }) => {
      const { data, error } = await supabase
        .from('joinery_item_cabinets')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          standard_cabinet:standard_cabinets(*)
        `)
        .single()
      
      if (error) throw error
      return data as JoineryItemCabinet
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['joinery-item-cabinets', data.joinery_item_id] })
    },
  })
}

// Remove a cabinet from a joinery item
export function useRemoveJoineryItemCabinet() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, joinery_item_id }: { id: string; joinery_item_id: string }) => {
      const { error } = await supabase
        .from('joinery_item_cabinets')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { id, joinery_item_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['joinery-item-cabinets', data.joinery_item_id] })
    },
  })
}

