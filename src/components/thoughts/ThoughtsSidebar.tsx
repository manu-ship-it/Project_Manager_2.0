'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, Search, Filter, Lightbulb, LogOut, ArrowLeft } from 'lucide-react'
import { useIdeas } from '@/hooks/useIdeas'
import { format } from 'date-fns'

export function ThoughtsSidebar() {
    const pathname = usePathname()
    const { data: ideas, isLoading } = useIdeas()
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')

    const filteredIdeas = ideas?.filter(idea => {
        const matchesSearch =
            idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            idea.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (idea.source || '').toLowerCase().includes(searchTerm.toLowerCase())

        const matchesCategory = categoryFilter === 'all' || idea.category === categoryFilter

        return matchesSearch && matchesCategory
    })

    return (
        <aside className="w-80 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-40 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <Link href="/" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="font-medium">Back</span>
                    </Link>
                    <div className="flex items-center space-x-2 text-purple-600 font-bold">
                        <Lightbulb className="h-5 w-5" />
                        <span>Thoughts Pad</span>
                    </div>
                </div>

                <Link
                    href="/thoughts/create"
                    className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    <span>New Idea</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-gray-200 space-y-3 bg-gray-50">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Search ideas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                    >
                        <option value="all">All Categories</option>
                        <option value="Random thoughts">Random thoughts</option>
                        <option value="Family">Family</option>
                        <option value="Home">Home</option>
                        <option value="Frameworks">Frameworks</option>
                        <option value="Famous Phrases">Famous Phrases</option>
                        <option value="Business Ideas">Business Ideas</option>
                        <option value="Others">Others</option>
                    </select>
                </div>
            </div>

            {/* Ideas List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                ) : filteredIdeas?.length === 0 ? (
                    <div className="text-center py-8 px-4 text-gray-500 text-sm">
                        No ideas found. Start by adding one!
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredIdeas?.map((idea) => (
                            <Link
                                key={idea.id}
                                href={`/thoughts/${idea.id}`}
                                className={`block p-4 hover:bg-purple-50 transition-colors ${pathname === `/thoughts/${idea.id}` ? 'bg-purple-50 border-l-4 border-purple-600' : 'border-l-4 border-transparent'
                                    }`}
                            >
                                <h3 className="font-medium text-gray-900 mb-1 truncate">{idea.title}</h3>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span className="truncate max-w-[120px]">{idea.category}</span>
                                    <span>{format(new Date(idea.created_at), 'MMM d')}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* User / Logout */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                    onClick={async () => {
                        const { createClient } = await import('@/utils/supabase/client')
                        const supabase = createClient()
                        await supabase.auth.signOut()
                        window.location.href = '/login'
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    )
}
