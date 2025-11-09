import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, SpecializedItem } from '@/lib/supabase'

// Get all specialized items for a joinery item
export function useSpecializedItems(joineryItemId: string) {
  return useQuery({
    queryKey: ['specialized-items', joineryItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specialized_items')
        .select('*')
        .eq('joinery_item_id', joineryItemId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Fetch related hardware and materials separately
      const itemsWithRelations = await Promise.all(
        (data || []).map(async (item: SpecializedItem) => {
          if (item.item_type === 'hardware' && item.item_id) {
            const { data: hardware } = await supabase
              .from('hardware')
              .select('*, supplier:suppliers(*)')
              .eq('id', item.item_id)
              .single()
            return { ...item, hardware: hardware || null, material: null }
          } else if (item.item_type === 'material' && item.item_id) {
            const { data: material } = await supabase
              .from('materials')
              .select('*, supplier:suppliers(*)')
              .eq('id', item.item_id)
              .single()
            return { ...item, hardware: null, material: material || null }
          }
          return { ...item, hardware: null, material: null }
        })
      )
      
      return itemsWithRelations as SpecializedItem[]
    },
    enabled: !!joineryItemId,
  })
}

// Create a new specialized item
export function useCreateSpecializedItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (itemData: Omit<SpecializedItem, 'id' | 'created_at' | 'updated_at' | 'hardware' | 'material' | 'joinery_item'>) => {
      const { data, error } = await supabase
        .from('specialized_items')
        .insert([itemData])
        .select('*')
        .single()
      
      if (error) {
        console.error('Supabase error creating specialized item:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        throw error
      }
      
      // Fetch related hardware or material
      let hardware = null
      let material = null
      if (data.item_type === 'hardware' && data.item_id) {
        const { data: hw } = await supabase
          .from('hardware')
          .select('*, supplier:suppliers(*)')
          .eq('id', data.item_id)
          .single()
        hardware = hw
      } else if (data.item_type === 'material' && data.item_id) {
        const { data: mat } = await supabase
          .from('materials')
          .select('*, supplier:suppliers(*)')
          .eq('id', data.item_id)
          .single()
        material = mat
      }
      
      return { ...data, hardware, material } as SpecializedItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['specialized-items', data.joinery_item_id] })
    },
  })
}

// Update a specialized item
export function useUpdateSpecializedItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, joinery_item_id, ...updates }: Partial<SpecializedItem> & { id: string; joinery_item_id: string }) => {
      const { data, error } = await supabase
        .from('specialized_items')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single()
      
      if (error) throw error
      
      // Fetch related hardware or material
      let hardware = null
      let material = null
      if (data.item_type === 'hardware' && data.item_id) {
        const { data: hw } = await supabase
          .from('hardware')
          .select('*, supplier:suppliers(*)')
          .eq('id', data.item_id)
          .single()
        hardware = hw
      } else if (data.item_type === 'material' && data.item_id) {
        const { data: mat } = await supabase
          .from('materials')
          .select('*, supplier:suppliers(*)')
          .eq('id', data.item_id)
          .single()
        material = mat
      }
      
      return { ...data, hardware, material } as SpecializedItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['specialized-items', data.joinery_item_id] })
    },
  })
}

// Delete a specialized item
export function useDeleteSpecializedItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, joinery_item_id }: { id: string; joinery_item_id: string }) => {
      const { error } = await supabase
        .from('specialized_items')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { id, joinery_item_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['specialized-items', data.joinery_item_id] })
    },
  })
}

