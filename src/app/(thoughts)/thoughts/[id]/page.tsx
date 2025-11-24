'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useIdeas, useDeleteIdea } from '@/hooks/useIdeas'
import { format } from 'date-fns'
import { Trash2, Edit, Calendar, Tag, Link as LinkIcon, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function IdeaPage() {
    const params = useParams()
    const router = useRouter()
    const { data: ideas, isLoading } = useIdeas()
    const deleteIdea = useDeleteIdea()

    const idea = ideas?.find(i => i.id === params.id)

    const handleDelete = async () => {
        if (!idea || !confirm('Are you sure you want to delete this idea?')) return

        try {
            await deleteIdea.mutateAsync(idea.id)
            router.push('/thoughts')
        } catch (error) {
            console.error('Error deleting idea:', error)
        }
    }

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
                <Link href="/thoughts" className="mt-4 text-purple-600 hover:underline">
                    Back to list
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-start justify-between mb-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
              ${idea.category === 'Business Ideas' ? 'bg-blue-100 text-blue-800' :
                                idea.category === 'Family' ? 'bg-pink-100 text-pink-800' :
                                    idea.category === 'Home' ? 'bg-green-100 text-green-800' :
                                        idea.category === 'Famous Phrases' ? 'bg-yellow-100 text-yellow-800' :
                                            idea.category === 'Frameworks' ? 'bg-indigo-100 text-indigo-800' :
                                                'bg-gray-100 text-gray-800'
                            }`}
                        >
                            {idea.category}
                        </span>
                        <div className="flex items-center space-x-2">
                            <Link
                                href={`/thoughts/${idea.id}/edit`}
                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Edit Idea"
                            >
                                <Edit className="h-5 w-5" />
                            </Link>
                            <button
                                onClick={handleDelete}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Idea"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{idea.title}</h1>

                    <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                        <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Created {format(new Date(idea.created_at), 'MMMM d, yyyy')}
                        </div>
                        {idea.source && (
                            <div className="flex items-center">
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Source: {idea.source}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
                        {idea.content}
                    </div>
                </div>
            </div>
        </div>
    )
}
