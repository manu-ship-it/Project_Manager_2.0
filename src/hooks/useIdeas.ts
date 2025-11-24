import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Idea } from '@/lib/supabase'

export function useIdeas() {
    const supabase = createClient()
    return useQuery({
        queryKey: ['ideas'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ideas')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            return data as Idea[]
        },
    })
}

export function useCreateIdea() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async (idea: Omit<Idea, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) throw new Error('User not authenticated')

            const { data, error } = await supabase
                .from('ideas')
                .insert([{ ...idea, created_by: user.id }])
                .select()
                .single()

            if (error) throw error
            return data as Idea
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ideas'] })
        },
    })
}

export function useUpdateIdea() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Idea> & { id: string }) => {
            const { data, error } = await supabase
                .from('ideas')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data as Idea
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ideas'] })
        },
    })
}

export function useDeleteIdea() {
    const queryClient = useQueryClient()
    const supabase = createClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('ideas')
                .delete()
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ideas'] })
        },
    })
}
