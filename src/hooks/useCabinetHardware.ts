import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, CabJoinHardware } from '@/lib/supabase'

// Get hardware for a specific cabinet
export function useCabinetHardware(cabinetId: string) {
  return useQuery({
    queryKey: ['cabinet-hardware', cabinetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cab_join_hardware')
        .select(`
          *,
          hardware:hardware(
            *,
            supplier:suppliers(*)
          ),
          cabinet:Cabinet(*)
        `)
        .eq('cab_id', cabinetId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as CabJoinHardware[]
    },
    enabled: !!cabinetId,
  })
}

// Add hardware to a cabinet
export function useAddCabinetHardware() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      cab_id: string
      hardware_id: string
      qty: number
      notes?: string | null
    }) => {
      const { data: result, error } = await supabase
        .from('cab_join_hardware')
        .insert([data])
        .select(`
          *,
          hardware:hardware(
            *,
            supplier:suppliers(*)
          ),
          cabinet:Cabinet(*)
        `)
        .single()
      
      if (error) throw error
      return result as CabJoinHardware
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-hardware', data.cab_id] })
    },
  })
}

// Update hardware quantity in a cabinet
export function useUpdateCabinetHardware() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CabJoinHardware> & { id: string }) => {
      const { data, error } = await supabase
        .from('cab_join_hardware')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          hardware:hardware(
            *,
            supplier:suppliers(*)
          ),
          cabinet:Cabinet(*)
        `)
        .single()
      
      if (error) throw error
      return data as CabJoinHardware
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-hardware', data.cab_id] })
    },
  })
}

// Remove hardware from a cabinet
export function useRemoveCabinetHardware() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, cab_id }: { id: string; cab_id: string }) => {
      const { error } = await supabase
        .from('cab_join_hardware')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { id, cab_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-hardware', data.cab_id] })
    },
  })
}

