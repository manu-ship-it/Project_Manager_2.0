'use client'

import { HardwareList } from '@/components/hardware/HardwareList'

export default function HardwarePage() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Hardware Library</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your global hardware catalog</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <HardwareList />
      </div>
    </div>
  )
}

