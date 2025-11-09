import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, QuoteJoineryItemMaterial } from '@/lib/supabase'

// Get all materials for a quote joinery item
export function useQuoteJoineryItemMaterials(quoteJoineryItemId: string) {
  return useQuery({
    queryKey: ['quote-joinery-item-materials', quoteJoineryItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_joinery_item_materials')
        .select(`
          *,
          material:materials(*, supplier:suppliers(*))
        `)
        .eq('quote_joinery_item_id', quoteJoineryItemId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as QuoteJoineryItemMaterial[]
    },
    enabled: !!quoteJoineryItemId,
  })
}

// Add a material to a quote joinery item
export function useAddQuoteJoineryItemMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ quote_joinery_item_id, material_id, quantity }: {
      quote_joinery_item_id: string
      material_id: string
      quantity: number
    }) => {
      const { data, error } = await supabase
        .from('quote_joinery_item_materials')
        .insert([{
          quote_joinery_item_id,
          material_id,
          quantity,
        }])
        .select()
        .single()
      
      if (error) throw error
      return data as QuoteJoineryItemMaterial
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quote-joinery-item-materials', variables.quote_joinery_item_id] })
    },
  })
}

// Update material quantity
export function useUpdateQuoteJoineryItemMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, quote_joinery_item_id, quantity }: {
      id: string
      quote_joinery_item_id: string
      quantity: number
    }) => {
      const { data, error } = await supabase
        .from('quote_joinery_item_materials')
        .update({ quantity })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as QuoteJoineryItemMaterial
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quote-joinery-item-materials', variables.quote_joinery_item_id] })
    },
  })
}

// Remove a material from a quote joinery item
export function useRemoveQuoteJoineryItemMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, quote_joinery_item_id }: {
      id: string
      quote_joinery_item_id: string
    }) => {
      const { error } = await supabase
        .from('quote_joinery_item_materials')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quote-joinery-item-materials', variables.quote_joinery_item_id] })
    },
  })
}

