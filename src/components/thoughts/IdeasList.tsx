'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Trash2, Tag, Quote, ExternalLink } from 'lucide-react'
import { useIdeas, useDeleteIdea } from '@/hooks/useIdeas'

interface IdeasListProps {
    searchTerm: string
    categoryFilter: string
}

export function IdeasList({ searchTerm, categoryFilter }: IdeasListProps) {
    const { data: ideas, isLoading } = useIdeas()
    const deleteIdea = useDeleteIdea()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this idea?')) return

        setDeletingId(id)
        try {
            await deleteIdea.mutateAsync(id)
        } catch (error) {
            console.error('Error deleting idea:', error)
        } finally {
            setDeletingId(null)
        }
    }

    const filteredIdeas = ideas?.filter(idea => {
        const matchesSearch =
            idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            idea.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (idea.source || '').toLowerCase().includes(searchTerm.toLowerCase())

        const matchesCategory = categoryFilter === 'all' || idea.category === categoryFilter

        return matchesSearch && matchesCategory
    })

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    if (!filteredIdeas || filteredIdeas.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="text-gray-400 mb-4">
                    <Quote className="mx-auto h-12 w-12 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No ideas found</h3>
                <p className="text-gray-500">
                    {searchTerm || categoryFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Start by adding your first idea'}
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIdeas.map((idea) => (
                <div
                    key={idea.id}
                    className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-300 flex flex-col group"
                >
                    <div className="p-6 flex-1">
                        <div className="flex items-start justify-between mb-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
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
                            <button
                                onClick={() => handleDelete(idea.id)}
                                disabled={deletingId === idea.id}
                                className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {idea.title}
                        </h3>

                        <p className="text-gray-600 text-sm whitespace-pre-wrap line-clamp-4 mb-4">
                            {idea.content}
                        </p>

                        {idea.source && (
                            <div className="flex items-center text-xs text-gray-500 mt-auto pt-4 border-t border-gray-100">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                <span className="truncate">Source: {idea.source}</span>
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t text-xs text-gray-500 flex justify-between items-center">
                        <span>{format(new Date(idea.created_at), 'MMM d, yyyy')}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}
