import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, JoineryItemMaterial } from '@/lib/supabase'

// Get materials for a specific joinery item
export function useJoineryItemMaterials(joineryItemId: string) {
  return useQuery({
    queryKey: ['joinery-item-materials', joineryItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('joinery_item_materials')
        .select(`
          *,
          material:materials(
            *,
            supplier:suppliers(*)
          )
        `)
        .eq('joinery_item_id', joineryItemId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as JoineryItemMaterial[]
    },
    enabled: !!joineryItemId,
  })
}

// Add a material to a joinery item
export function useAddJoineryItemMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      joinery_item_id: string
      material_id: string
      quantity: number
    }) => {
      const { data: result, error } = await supabase
        .from('joinery_item_materials')
        .insert([data])
        .select(`
          *,
          material:materials(
            *,
            supplier:suppliers(*)
          )
        `)
        .single()
      
      if (error) throw error
      return result as JoineryItemMaterial
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['joinery-item-materials', data.joinery_item_id] })
    },
  })
}

// Update quantity of a material in a joinery item
export function useUpdateJoineryItemMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { data, error } = await supabase
        .from('joinery_item_materials')
        .update({ quantity })
        .eq('id', id)
        .select(`
          *,
          material:materials(
            *,
            supplier:suppliers(*)
          )
        `)
        .single()
      
      if (error) throw error
      return data as JoineryItemMaterial
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['joinery-item-materials', data.joinery_item_id] })
    },
  })
}

// Remove a material from a joinery item
export function useRemoveJoineryItemMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, joinery_item_id }: { id: string; joinery_item_id: string }) => {
      const { error } = await supabase
        .from('joinery_item_materials')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { id, joinery_item_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['joinery-item-materials', data.joinery_item_id] })
    },
  })
}

