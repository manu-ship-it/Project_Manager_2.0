import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save } from 'lucide-react'
import { useCreateIdea, useUpdateIdea } from '@/hooks/useIdeas'
import { Idea } from '@/lib/supabase'

const ideaSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    category: z.enum(['Random thoughts', 'Family', 'Home', 'Frameworks', 'Famous Phrases', 'Business Ideas', 'Others']),
    source: z.string().optional(),
})

type IdeaFormData = z.infer<typeof ideaSchema>

interface IdeaFormProps {
    onCancel: () => void
    onSuccess?: () => void
    initialData?: Idea
}

export function IdeaForm({ onCancel, onSuccess, initialData }: IdeaFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const createIdea = useCreateIdea()
    const updateIdea = useUpdateIdea()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<IdeaFormData>({
        resolver: zodResolver(ideaSchema),
        defaultValues: {
            title: initialData?.title || '',
            content: initialData?.content || '',
            category: initialData?.category || 'Random thoughts',
            source: initialData?.source || '',
        },
    })

    const onSubmit = async (data: IdeaFormData) => {
        setIsSubmitting(true)
        try {
            if (initialData) {
                await updateIdea.mutateAsync({
                    id: initialData.id,
                    ...data,
                    source: data.source || null,
                })
            } else {
                await createIdea.mutateAsync({
                    ...data,
                    source: data.source || null,
                    position: 0,
                    folder_id: null,
                })
            }
            if (onSuccess) onSuccess()
        } catch (error) {
            console.error('Error saving idea:', JSON.stringify(error, null, 2))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="w-full mx-auto p-4 md:p-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {initialData ? 'Edit Idea' : 'New Idea'}
                    </h2>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 flex-1 overflow-y-auto">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            {...register('title')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900"
                            placeholder="What's on your mind?"
                        />
                        {errors.title && (
                            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category *
                        </label>
                        <select
                            {...register('category')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white text-gray-900"
                        >
                            <option value="Random thoughts">Random thoughts</option>
                            <option value="Family">Family</option>
                            <option value="Home">Home</option>
                            <option value="Frameworks">Frameworks</option>
                            <option value="Famous Phrases">Famous Phrases</option>
                            <option value="Business Ideas">Business Ideas</option>
                            <option value="Others">Others</option>
                        </select>
                        {errors.category && (
                            <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                        )}
                    </div>

                    {/* Source */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Source
                        </label>
                        <input
                            type="text"
                            {...register('source')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900"
                            placeholder="e.g., Book, Conversation, Dream..."
                        />
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content *
                        </label>
                        <textarea
                            {...register('content')}
                            rows={12}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none text-gray-900 flex-1 min-h-[200px]"
                            placeholder="Elaborate on your idea..."
                        />
                        {errors.content && (
                            <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <Save className="h-4 w-4" />
                            <span>{isSubmitting ? 'Saving...' : 'Save Idea'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
