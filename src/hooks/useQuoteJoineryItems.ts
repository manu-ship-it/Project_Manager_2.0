import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, JoineryItem } from '@/lib/supabase'

// Get all joinery items for a quote (filtered by quote = true)
export function useQuoteJoineryItems(quoteId: string) {
  return useQuery({
    queryKey: ['quote-joinery-items', quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('joinery_item')
        .select(`
          *,
          quote_project:quote_project(*),
          carcass_material:materials!carcass_material_id(*, supplier:suppliers(*)),
          face_material_1:materials!face_material_1_id(*, supplier:suppliers(*)),
          face_material_2:materials!face_material_2_id(*, supplier:suppliers(*)),
          face_material_3:materials!face_material_3_id(*, supplier:suppliers(*)),
          face_material_4:materials!face_material_4_id(*, supplier:suppliers(*)),
          hinge:hardware!hinge_id(*, supplier:suppliers(*)),
          drawer_hardware:hardware!drawer_hardware_id(*, supplier:suppliers(*))
        `)
        .eq('quote_proj_id', quoteId)
        .eq('quote', true) // Only get quote joinery items
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as JoineryItem[]
    },
    enabled: !!quoteId,
  })
}

// Create a new joinery item for a quote
export function useCreateQuoteJoineryItem() {
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
          quote_project:quote_project(*),
          carcass_material:materials!carcass_material_id(*, supplier:suppliers(*)),
          face_material_1:materials!face_material_1_id(*, supplier:suppliers(*)),
          face_material_2:materials!face_material_2_id(*, supplier:suppliers(*)),
          face_material_3:materials!face_material_3_id(*, supplier:suppliers(*)),
          face_material_4:materials!face_material_4_id(*, supplier:suppliers(*)),
          hinge:hardware!hinge_id(*, supplier:suppliers(*)),
          drawer_hardware:hardware!drawer_hardware_id(*, supplier:suppliers(*))
        `)
        .single()
      
      if (error) {
        console.error('Supabase error creating quote joinery item:', error)
        throw error
      }
      return data as JoineryItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quote-joinery-items', data.quote_proj_id] })
      queryClient.invalidateQueries({ queryKey: ['joinery-items', data.quote_proj_id] })
    },
  })
}

// Update a quote joinery item
export function useUpdateQuoteJoineryItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, quote_proj_id, ...updates }: Partial<JoineryItem> & { id: string; quote_proj_id: string }) => {
      const { data, error } = await supabase
        .from('joinery_item')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          quote_project:quote_project(*),
          carcass_material:materials!carcass_material_id(*, supplier:suppliers(*)),
          face_material_1:materials!face_material_1_id(*, supplier:suppliers(*)),
          face_material_2:materials!face_material_2_id(*, supplier:suppliers(*)),
          face_material_3:materials!face_material_3_id(*, supplier:suppliers(*)),
          face_material_4:materials!face_material_4_id(*, supplier:suppliers(*)),
          hinge:hardware!hinge_id(*, supplier:suppliers(*)),
          drawer_hardware:hardware!drawer_hardware_id(*, supplier:suppliers(*))
        `)
        .single()
      
      if (error) throw error
      return data as JoineryItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quote-joinery-items', data.quote_proj_id] })
      queryClient.invalidateQueries({ queryKey: ['joinery-items', data.quote_proj_id] })
    },
  })
}

// Delete a quote joinery item
export function useDeleteQuoteJoineryItem() {
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
      queryClient.invalidateQueries({ queryKey: ['quote-joinery-items', data.quote_proj_id] })
      queryClient.invalidateQueries({ queryKey: ['joinery-items', data.quote_proj_id] })
    },
  })
}

