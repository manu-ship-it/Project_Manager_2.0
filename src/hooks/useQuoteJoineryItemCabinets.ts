import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, QuoteJoineryItemCabinet } from '@/lib/supabase'

// Get all cabinets for a quote joinery item
export function useQuoteJoineryItemCabinets(quoteJoineryItemId: string) {
  return useQuery({
    queryKey: ['quote-joinery-item-cabinets', quoteJoineryItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_joinery_item_cabinets')
        .select(`
          *,
          standard_cabinet:standard_cabinets(*)
        `)
        .eq('quote_joinery_item_id', quoteJoineryItemId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as QuoteJoineryItemCabinet[]
    },
    enabled: !!quoteJoineryItemId,
  })
}

// Add a cabinet to a quote joinery item
export function useAddQuoteJoineryItemCabinet() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ quote_joinery_item_id, standard_cabinet_id, quantity, custom_width, custom_height, custom_depth, notes }: {
      quote_joinery_item_id: string
      standard_cabinet_id: string
      quantity: number
      custom_width?: number | null
      custom_height?: number | null
      custom_depth?: number | null
      notes?: string | null
    }) => {
      const { data, error } = await supabase
        .from('quote_joinery_item_cabinets')
        .insert([{
          quote_joinery_item_id,
          standard_cabinet_id,
          quantity,
          custom_width: custom_width || null,
          custom_height: custom_height || null,
          custom_depth: custom_depth || null,
          notes: notes || null,
        }])
        .select()
        .single()
      
      if (error) throw error
      return data as QuoteJoineryItemCabinet
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quote-joinery-item-cabinets', variables.quote_joinery_item_id] })
    },
  })
}

// Update a quote joinery item cabinet
export function useUpdateQuoteJoineryItemCabinet() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, quote_joinery_item_id, ...updates }: Partial<QuoteJoineryItemCabinet> & {
      id: string
      quote_joinery_item_id: string
    }) => {
      const { data, error } = await supabase
        .from('quote_joinery_item_cabinets')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as QuoteJoineryItemCabinet
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quote-joinery-item-cabinets', variables.quote_joinery_item_id] })
    },
  })
}

// Remove a cabinet from a quote joinery item
export function useRemoveQuoteJoineryItemCabinet() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, quote_joinery_item_id }: {
      id: string
      quote_joinery_item_id: string
    }) => {
      const { error } = await supabase
        .from('quote_joinery_item_cabinets')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quote-joinery-item-cabinets', variables.quote_joinery_item_id] })
    },
  })
}

