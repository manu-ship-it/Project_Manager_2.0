import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Folder } from '@/lib/supabase'

export function useFolders() {
    return useQuery({
        queryKey: ['folders'],
        queryFn: async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('folders')
                .select('*')
                .order('position', { ascending: true })
                .order('created_at', { ascending: false })

            if (error) throw error
            return data as Folder[]
        },
    })
}

export function useCreateFolder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (name: string) => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('folders')
                .insert([{ name }])
                .select()
                .single()

            if (error) throw error
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] })
        },
    })
}

export function useDeleteFolder() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const supabase = createClient()

            // First, move all ideas in this folder to root
            const { error: updateError } = await supabase
                .from('ideas')
                .update({ folder_id: null })
                .eq('folder_id', id)

            if (updateError) throw updateError

            // Then delete the folder
            const { error } = await supabase
                .from('folders')
                .delete()
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] })
            queryClient.invalidateQueries({ queryKey: ['ideas'] })
        },
    })
}
