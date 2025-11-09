import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, TemplateCabinet } from '@/lib/supabase'

// Get all template cabinets from global library
export function useTemplateCabinets() {
  return useQuery({
    queryKey: ['template-cabinets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_cabinet')
        .select('*')
        .order('category', { ascending: true })
        .order('type', { ascending: true })
        .order('width', { ascending: true })
        .order('height', { ascending: true })
      
      if (error) throw error
      return data as TemplateCabinet[]
    },
  })
}

// Get template cabinets filtered by category
export function useTemplateCabinetsByCategory(category: string | null) {
  return useQuery({
    queryKey: ['template-cabinets', category],
    queryFn: async () => {
      let query = supabase
        .from('template_cabinet')
        .select('*')
        .order('type', { ascending: true })
        .order('width', { ascending: true })
        .order('height', { ascending: true })
      
      if (category) {
        query = query.eq('category', category)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data as TemplateCabinet[]
    },
    enabled: true,
  })
}

export function useCreateTemplateCabinet() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (cabinetData: Omit<TemplateCabinet, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('template_cabinet')
        .insert([cabinetData])
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error creating template cabinet:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        throw error
      }
      return data as TemplateCabinet
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-cabinets'] })
    },
  })
}

export function useUpdateTemplateCabinet() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TemplateCabinet> & { id: string }) => {
      const { data, error } = await supabase
        .from('template_cabinet')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as TemplateCabinet
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-cabinets'] })
    },
  })
}

export function useDeleteTemplateCabinet() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('template_cabinet')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-cabinets'] })
    },
  })
}

