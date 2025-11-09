import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Customer } from '@/lib/supabase'

// Get all customers
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer')
        .select('*')
        .order('company_name', { ascending: true })
      
      if (error) throw error
      return data as Customer[]
    },
  })
}

// Get a single customer by ID
export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as Customer
    },
    enabled: !!id,
  })
}

// Create a new customer
export function useCreateCustomer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('customer')
        .insert([customerData])
        .select()
        .single()
      
      if (error) throw error
      return data as Customer
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

// Update a customer
export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from('customer')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data as Customer
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer', data.id] })
    },
  })
}

// Delete a customer
export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customer')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Supabase error deleting customer:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        
        // Provide user-friendly error messages
        if (error.code === '23503') {
          throw new Error('Cannot delete customer: This customer is being used in quotes or projects. Please remove all references first.')
        }
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

