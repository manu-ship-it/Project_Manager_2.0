import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, QuoteProject } from '@/lib/supabase'

// Get all quote_projects (both quotes and projects)
export function useQuoteProjects() {
  return useQuery({
    queryKey: ['quote-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_project')
        .select(`
          *,
          customer:customer(*)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as QuoteProject[]
    },
  })
}

// Get only quotes (quote = true)
export function useQuotes() {
  return useQuery({
    queryKey: ['quote-projects', 'quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_project')
        .select(`
          *,
          customer:customer(*)
        `)
        .eq('quote', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as QuoteProject[]
    },
  })
}

// Get only projects (quote = false)
export function useProjects() {
  return useQuery({
    queryKey: ['quote-projects', 'projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_project')
        .select(`
          *,
          customer:customer(*)
        `)
        .eq('quote', false)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as QuoteProject[]
    },
  })
}

// Get a single quote_project by ID
export function useQuoteProject(id: string) {
  return useQuery({
    queryKey: ['quote-project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_project')
        .select(`
          *,
          customer:customer(*)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as QuoteProject
    },
    enabled: !!id,
  })
}

// Create a new quote_project
export function useCreateQuoteProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (projectData: Omit<QuoteProject, 'id' | 'created_at' | 'updated_at' | 'customer'>) => {
      const { data, error } = await supabase
        .from('quote_project')
        .insert([projectData])
        .select(`
          *,
          customer:customer(*)
        `)
        .single()
      
      if (error) throw error
      return data as QuoteProject
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-projects'] })
    },
  })
}

// Update a quote_project
export function useUpdateQuoteProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QuoteProject> & { id: string }) => {
      const { data, error } = await supabase
        .from('quote_project')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          customer:customer(*)
        `)
        .single()
      
      if (error) throw error
      return data as QuoteProject
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quote-projects'] })
      queryClient.invalidateQueries({ queryKey: ['quote-project', data.id] })
    },
  })
}

// Delete a quote_project
export function useDeleteQuoteProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quote_project')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote-projects'] })
    },
  })
}

