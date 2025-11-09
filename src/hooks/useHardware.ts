import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Hardware } from '@/lib/supabase'

// Get all hardware from global library
export function useHardware() {
  return useQuery({
    queryKey: ['hardware'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Hardware[]
    },
  })
}

export function useCreateHardware() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (hardwareData: Omit<Hardware, 'id' | 'created_at' | 'updated_at' | 'supplier'>) => {
      const { data, error } = await supabase
        .from('hardware')
        .insert([hardwareData])
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .single()
      
      if (error) {
        console.error('Supabase error creating hardware:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        throw error
      }
      return data as Hardware
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware'] })
    },
  })
}

export function useUpdateHardware() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Hardware> & { id: string }) => {
      const { data, error } = await supabase
        .from('hardware')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .single()
      
      if (error) throw error
      return data as Hardware
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware'] })
    },
  })
}

export function useDeleteHardware() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hardware')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware'] })
    },
  })
}

