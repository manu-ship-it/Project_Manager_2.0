'use client'

import { useParams, useRouter } from 'next/navigation'
import { IdeaForm } from '@/components/thoughts/IdeaForm'
import { useIdeas } from '@/hooks/useIdeas'

export default function EditIdeaPage() {
    const params = useParams()
    const router = useRouter()
    const { data: ideas, isLoading } = useIdeas()

    const idea = ideas?.find(i => i.id === params.id)

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    if (!idea) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p className="text-lg">Idea not found</p>
                <button
                    onClick={() => router.push('/thoughts')}
                    className="mt-4 text-purple-600 hover:underline"
                >
                    Back to list
                </button>
            </div>
        )
    }

    return (
        <div className="h-full bg-gray-50 p-8 overflow-y-auto">
            <IdeaForm
                initialData={idea}
                onCancel={() => router.back()}
                onSuccess={() => router.push(`/thoughts/${idea.id}`)}
            />
        </div>
    )
}
