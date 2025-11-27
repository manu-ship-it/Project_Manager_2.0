'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, Search, Filter, Lightbulb, LogOut, ArrowLeft, Menu, X, FolderPlus, Folder as FolderIcon, ChevronRight, ChevronDown, GripVertical } from 'lucide-react'
import { useIdeas, useUpdateIdeaPosition } from '@/hooks/useIdeas'
import { useFolders, useCreateFolder, useDeleteFolder } from '@/hooks/useFolders'
import { format } from 'date-fns'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable Idea Item Component
function SortableIdeaItem({ idea, pathname }: { idea: any, pathname: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: idea.id, data: { type: 'idea', idea } })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            <div {...attributes} {...listeners} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-500 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <GripVertical className="h-4 w-4" />
            </div>
            <Link
                href={`/thoughts/${idea.id}`}
                className={`block p-4 pl-8 hover:bg-purple-50 transition-colors ${pathname === `/thoughts/${idea.id}` ? 'bg-purple-50 border-l-4 border-purple-600' : 'border-l-4 border-transparent'
                    }`}
            >
                <h3 className="font-medium text-gray-900 mb-1 truncate">{idea.title}</h3>
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate max-w-[120px]">{idea.category}</span>
                    <span>{format(new Date(idea.created_at), 'MMM d')}</span>
                </div>
            </Link>
        </div>
    )
}

// Droppable Folder Component
function DroppableFolder({ folder, ideas, pathname, onDelete }: { folder: any, ideas: any[], pathname: string, onDelete: (id: string) => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const { setNodeRef, isOver } = useSortable({
        id: folder.id,
        data: { type: 'folder', folder },
        disabled: true // Folders themselves aren't draggable in this version
    })

    return (
        <div ref={setNodeRef} className={`mb-2 ${isOver ? 'bg-purple-100 ring-2 ring-purple-500 ring-inset rounded-lg' : ''}`}>
            <div className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg group">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center space-x-2 flex-1 text-left"
                >
                    {isOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                    <FolderIcon className={`h-4 w-4 ${isOver ? 'text-purple-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-gray-700">{folder.name}</span>
                    <span className="text-xs text-gray-400">({ideas.length})</span>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Delete folder? Ideas inside will be moved to root.')) onDelete(folder.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>

            {isOpen && (
                <div className="pl-4 mt-1 space-y-1 border-l-2 border-gray-100 ml-3">
                    {ideas.map((idea) => (
                        <SortableIdeaItem key={idea.id} idea={idea} pathname={pathname} />
                    ))}
                    {ideas.length === 0 && (
                        <div className="py-2 text-xs text-gray-400 italic pl-4">Empty folder</div>
                    )}
                </div>
            )}
        </div>
    )
}

export function ThoughtsSidebar() {
    const pathname = usePathname()
    const { data: ideas, isLoading: ideasLoading } = useIdeas()
    const { data: folders, isLoading: foldersLoading } = useFolders()
    const createFolder = useCreateFolder()
    const deleteFolder = useDeleteFolder()
    const updateIdeaPosition = useUpdateIdeaPosition()

    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [isCreatingFolder, setIsCreatingFolder] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [activeId, setActiveId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Close mobile sidebar on navigation
    useEffect(() => {
        setIsMobileOpen(false)
    }, [pathname])

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newFolderName.trim()) return
        await createFolder.mutateAsync(newFolderName)
        setNewFolderName('')
        setIsCreatingFolder(false)
    }

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (!over) {
            setActiveId(null)
            return
        }

        const activeIdea = ideas?.find(i => i.id === active.id)
        if (!activeIdea) return

        // Dropped on a folder
        if (over.data.current?.type === 'folder') {
            const folderId = over.id as string
            if (activeIdea.folder_id !== folderId) {
                await updateIdeaPosition.mutateAsync({
                    id: activeIdea.id,
                    folder_id: folderId,
                    position: 0 // Add to top of folder
                })
            }
        }
        // Reordering within list
        else if (active.id !== over.id) {
            const oldIndex = ideas?.findIndex((i) => i.id === active.id)
            const newIndex = ideas?.findIndex((i) => i.id === over.id)

            if (oldIndex !== undefined && newIndex !== undefined && ideas) {
                // Optimistic update could go here, but for now we'll just update DB
                // We need to calculate the new position based on neighbors
                // For simplicity in this MVP, we'll just swap for now or rely on array index
                // A robust implementation would use a float/lexorank for position
                // Here we just update the folder_id if it changed (dragged to another list)
                // or just reorder if in same list.

                // Check if we moved between folders (if the over item is in a different folder)
                const overIdea = ideas.find(i => i.id === over.id)
                if (overIdea && activeIdea.folder_id !== overIdea.folder_id) {
                    await updateIdeaPosition.mutateAsync({
                        id: activeIdea.id,
                        folder_id: overIdea.folder_id,
                        position: newIndex
                    })
                } else {
                    // Same folder reorder - strictly speaking we need to update positions of all items
                    // For this MVP, let's just update the position to the new index
                    await updateIdeaPosition.mutateAsync({
                        id: activeIdea.id,
                        folder_id: activeIdea.folder_id,
                        position: newIndex
                    })
                }
            }
        }

        setActiveId(null)
    }

    const filteredIdeas = ideas?.filter(idea => {
        const matchesSearch =
            idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            idea.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (idea.source || '').toLowerCase().includes(searchTerm.toLowerCase())

        const matchesCategory = categoryFilter === 'all' || idea.category === categoryFilter

        return matchesSearch && matchesCategory
    })

    // Group ideas by folder
    const rootIdeas = filteredIdeas?.filter(i => !i.folder_id) || []
    const ideasByFolder = folders?.reduce((acc, folder) => {
        acc[folder.id] = filteredIdeas?.filter(i => i.folder_id === folder.id) || []
        return acc
    }, {} as Record<string, typeof rootIdeas>)

    const isLoading = ideasLoading || foldersLoading

    return (
        <>
            {/* Mobile Toggle */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200 text-gray-700"
            >
                {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Overlay */}
            {isMobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-80 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-40 flex flex-col
                transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4 pl-10 md:pl-0">
                        <Link href="/" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
                            <ArrowLeft className="h-5 w-5" />
                            <span className="font-medium">Back</span>
                        </Link>
                        <div className="flex items-center space-x-2 text-purple-600 font-bold">
                            <Lightbulb className="h-5 w-5" />
                            <span>Thoughts Pad</span>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <Link
                            href="/thoughts/create"
                            className="flex-1 flex items-center justify-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-sm text-sm"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New Idea</span>
                        </Link>
                        <button
                            onClick={() => setIsCreatingFolder(true)}
                            className="flex items-center justify-center p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            title="New Folder"
                        >
                            <FolderPlus className="h-4 w-4" />
                        </button>
                    </div>

                    {isCreatingFolder && (
                        <form onSubmit={handleCreateFolder} className="mt-3 flex items-center space-x-2">
                            <input
                                type="text"
                                autoFocus
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Folder name"
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                            <button type="submit" className="text-purple-600 hover:text-purple-700">
                                <Plus className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => setIsCreatingFolder(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-4 w-4" />
                            </button>
                        </form>
                    )}
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
                    {/* Category Filter - Hidden if dragging to simplify UI */}
                    {!activeId && (
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
                    )}
                </div>

                {/* Ideas List & Folders */}
                <div className="flex-1 overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={filteredIdeas?.map(i => i.id) || []}
                                strategy={verticalListSortingStrategy}
                            >
                                {/* Folders Section */}
                                <div className="space-y-1 mb-4">
                                    {folders?.map(folder => (
                                        <DroppableFolder
                                            key={folder.id}
                                            folder={folder}
                                            ideas={ideasByFolder?.[folder.id] || []}
                                            pathname={pathname}
                                            onDelete={(id) => deleteFolder.mutate(id)}
                                        />
                                    ))}
                                </div>

                                {/* Root Ideas Section */}
                                <div className="space-y-1">
                                    {rootIdeas.length > 0 && folders && folders.length > 0 && (
                                        <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Uncategorized
                                        </div>
                                    )}
                                    {rootIdeas.map((idea) => (
                                        <SortableIdeaItem key={idea.id} idea={idea} pathname={pathname} />
                                    ))}
                                </div>
                            </SortableContext>

                            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
                                {activeId ? (
                                    <div className="bg-white p-4 rounded-lg shadow-lg border border-purple-200 opacity-90">
                                        <h3 className="font-medium text-gray-900 mb-1 truncate">
                                            {ideas?.find(i => i.id === activeId)?.title}
                                        </h3>
                                    </div>
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    )}

                    {!isLoading && filteredIdeas?.length === 0 && (
                        <div className="text-center py-8 px-4 text-gray-500 text-sm">
                            No ideas found. Start by adding one!
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
        </>
    )
}
