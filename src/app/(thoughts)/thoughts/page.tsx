'use client'

import { Lightbulb } from 'lucide-react'

export default function ThoughtsPage() {
    return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
            <div className="bg-white p-6 rounded-full shadow-sm mb-6">
                <Lightbulb className="h-16 w-16 text-purple-200" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">Select an idea</h2>
            <p className="text-gray-500 text-center max-w-sm">
                Choose an idea from the sidebar to view its details, or create a new one to get started.
            </p>
        </div>
    )
}
