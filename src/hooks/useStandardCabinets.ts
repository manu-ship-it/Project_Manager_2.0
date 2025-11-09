import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, StandardCabinet } from '@/lib/supabase'

// Get all standard cabinets from global library
export function useStandardCabinets() {
  return useQuery({
    queryKey: ['standard-cabinets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standard_cabinets')
        .select('*')
        .order('cabinet_category', { ascending: true })
        .order('cabinet_type', { ascending: true })
        .order('cabinet_width', { ascending: true })
        .order('cabinet_height', { ascending: true })
      
      if (error) throw error
      return data as StandardCabinet[]
    },
  })
}

// Get standard cabinets filtered by category
export function useStandardCabinetsByCategory(category: StandardCabinet['category'] | null) {
  return useQuery({
    queryKey: ['standard-cabinets', category],
    queryFn: async () => {
      let query = supabase
        .from('standard_cabinets')
        .select('*')
        .order('cabinet_type', { ascending: true })
        .order('cabinet_width', { ascending: true })
        .order('cabinet_height', { ascending: true })
      
      if (category) {
        query = query.eq('cabinet_category', category)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data as StandardCabinet[]
    },
    enabled: true,
  })
}

export function useCreateStandardCabinet() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (cabinetData: Omit<StandardCabinet, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('standard_cabinets')
        .insert([cabinetData])
        .select()
        .single()
      
      if (error) throw error
      return data as StandardCabinet
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standard-cabinets'] })
    },
  })
}

export function useUpdateStandardCabinet() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StandardCabinet> & { id: string }) => {
      const { data, error } = await supabase
        .from('standard_cabinets')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as StandardCabinet
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standard-cabinets'] })
    },
  })
}

export function useDeleteStandardCabinet() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('standard_cabinets')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standard-cabinets'] })
    },
  })
}

