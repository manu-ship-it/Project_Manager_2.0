import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Material } from '@/lib/supabase'

// Get all materials from global library (no project filtering)
export function useMaterials() {
  return useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      // Return with supplier relation included
      return data as (Material & { supplier?: { id: string; name: string } | null })[]
    },
  })
}

export function useCreateMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (materialData: Omit<Material, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('materials')
        .insert([materialData])
        .select()
        .single()
      
      if (error) throw error
      return data as Material
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Material> & { id: string }) => {
      const { data, error } = await supabase
        .from('materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as Material
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}