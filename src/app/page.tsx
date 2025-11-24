'use client'

import Link from 'next/link'
import { Hammer, Lightbulb } from 'lucide-react'

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <h1 className="text-4xl font-bold text-center text-gray-900 mb-12">
                    Welcome Back
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Joinery Project Manager Card */}
                    <Link
                        href="/dashboard"
                        className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-transparent hover:border-blue-200"
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="p-4 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                                <Hammer className="h-12 w-12 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Joinery Project Manager
                            </h2>
                            <p className="text-gray-600">
                                Manage projects, quotes, and installations
                            </p>
                        </div>
                    </Link>

                    {/* Thoughts Pad Card */}
                    <Link
                        href="/thoughts"
                        className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-transparent hover:border-purple-200"
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="p-4 bg-purple-50 rounded-full group-hover:bg-purple-100 transition-colors">
                                <Lightbulb className="h-12 w-12 text-purple-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Thoughts Pad
                            </h2>
                            <p className="text-gray-600">
                                Capture ideas, thoughts, and inspiration
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}
