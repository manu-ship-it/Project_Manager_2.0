'use client'

import { QuotesList } from '@/components/quotes/QuotesList'

export default function QuotesPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6 pt-12 sm:pt-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quotes</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Create and manage project quotes</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <QuotesList />
      </div>
    </div>
  )
}

