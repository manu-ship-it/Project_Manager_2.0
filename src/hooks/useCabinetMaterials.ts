import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, CabJoinMaterial } from '@/lib/supabase'

// Get material overrides for a specific cabinet
export function useCabinetMaterials(cabinetId: string) {
  return useQuery({
    queryKey: ['cabinet-materials', cabinetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cab_join_material')
        .select(`
          *,
          material:materials(
            *,
            supplier:suppliers(*)
          ),
          cabinet:Cabinet(*)
        `)
        .eq('cab_id', cabinetId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as CabJoinMaterial[]
    },
    enabled: !!cabinetId,
  })
}

// Add a material override to a cabinet
export function useAddCabinetMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      cab_id: string
      material_id: string
      qty: number
      notes?: string | null
    }) => {
      const { data: result, error } = await supabase
        .from('cab_join_material')
        .insert([data])
        .select(`
          *,
          material:materials(
            *,
            supplier:suppliers(*)
          ),
          cabinet:Cabinet(*)
        `)
        .single()
      
      if (error) throw error
      return result as CabJoinMaterial
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-materials', data.cab_id] })
    },
  })
}

// Update quantity of a material override in a cabinet
export function useUpdateCabinetMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CabJoinMaterial> & { id: string }) => {
      const { data, error } = await supabase
        .from('cab_join_material')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          material:materials(
            *,
            supplier:suppliers(*)
          ),
          cabinet:Cabinet(*)
        `)
        .single()
      
      if (error) throw error
      return data as CabJoinMaterial
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-materials', data.cab_id] })
    },
  })
}

// Remove a material override from a cabinet
export function useRemoveCabinetMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, cab_id }: { id: string; cab_id: string }) => {
      const { error } = await supabase
        .from('cab_join_material')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { id, cab_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cabinet-materials', data.cab_id] })
    },
  })
}

