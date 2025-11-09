import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Cabinet } from '@/lib/supabase'

// Get cabinets for a specific joinery item
export function useCabinets(joineryItemId: string) {
  return useQuery({
    queryKey: ['cabinets', joineryItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet')
        .select(`
          *,
          template_cabinet:template_cabinet(*),
          joinery_item:joinery_item(*)
        `)
        .eq('joinery_item_id', joineryItemId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Cabinet[]
    },
    enabled: !!joineryItemId,
  })
}

// Get a single cabinet by ID
export function useCabinet(cabinetId: string) {
  return useQuery({
    queryKey: ['cabinet', cabinetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cabinet')
        .select(`
          *,
          template_cabinet:template_cabinet(*),
          joinery_item:joinery_item(*)
        `)
        .eq('id', cabinetId)
        .single()
      
      if (error) throw error
      return data as Cabinet
    },
    enabled: !!cabinetId,
  })
}

// Add a cabinet to a joinery item
export function useCreateCabinet() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (cabinetData: Omit<Cabinet, 'id' | 'created_at' | 'updated_at' | 'template_cabinet' | 'joinery_item'>) => {
      const { data, error } = await supabase
        .from('cabinet')
        .insert([cabinetData])
        .select(`
          *,
          template_cabinet:template_cabinet(*),
          joinery_item:joinery_item(*)
        `)
        .single()
      
      if (error) throw error
      return data as Cabinet
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cabinets', data.joinery_item_id] })
    },
  })
}

// Update a cabinet
export function useUpdateCabinet() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Cabinet> & { id: string }) => {
      const { data, error } = await supabase
        .from('cabinet')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          template_cabinet:template_cabinet(*),
          joinery_item:joinery_item(*)
        `)
        .single()
      
      if (error) throw error
      return data as Cabinet
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cabinets', data.joinery_item_id] })
      queryClient.invalidateQueries({ queryKey: ['cabinet', data.id] })
    },
  })
}

// Delete a cabinet
export function useDeleteCabinet() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, joinery_item_id }: { id: string; joinery_item_id: string }) => {
      const { error } = await supabase
        .from('cabinet')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { id, joinery_item_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cabinets', data.joinery_item_id] })
    },
  })
}

