import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Setting } from '@/lib/supabase'

// Get a setting by key
export function useSetting(key: string) {
  return useQuery({
    queryKey: ['setting', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', key)
        .single()
      
      if (error) throw error
      return data as Setting
    },
  })
}

// Get setting value as number
export function useSettingValue(key: string, defaultValue: number = 0) {
  const { data: setting, isLoading } = useSetting(key)
  
  return {
    value: setting ? (isNaN(parseFloat(setting.value)) ? defaultValue : parseFloat(setting.value)) : defaultValue,
    isLoading,
    setting,
  }
}

// Update a setting
export function useUpdateSetting() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      // First try to update
      const { data, error: updateError } = await supabase
        .from('settings')
        .update({ value })
        .eq('key', key)
        .select()
        .single()
      
      // If setting doesn't exist, create it
      if (updateError && updateError.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('settings')
          .insert([{ key, value }])
          .select()
          .single()
        
        if (insertError) throw insertError
        return newData as Setting
      }
      
      if (updateError) throw updateError
      return data as Setting
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['setting', data.key] })
    },
  })
}

