'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Calendar, DollarSign, User, MapPin, Plus } from 'lucide-react'
import Link from 'next/link'
import { useQuoteProject } from '@/hooks/useQuoteProjects'
import { QuoteJoineryItemsList } from '@/components/quotes/QuoteJoineryItemsList'
import { JoineryItem } from '@/lib/supabase'

export default function QuoteDetailPage() {
  const params = useParams()
  const quoteId = params.id as string
  const { data: quote, isLoading, error } = useQuoteProject(quoteId)
  const [selectedJoineryItem, setSelectedJoineryItem] = useState<JoineryItem | null>(null)
  const [showJoineryForm, setShowJoineryForm] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Quote Not Found</h2>
          <p className="text-gray-600 mb-4">The quote you're looking for doesn't exist.</p>
          <Link
            href="/quotes"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Quotes</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-6 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-3 pt-12 sm:pt-0">
              <Link
                href="/quotes"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Back to Quotes</span>
              </Link>
              <div className="hidden sm:block h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{quote.quote_num || 'Quote'}</h1>
                <p className="text-sm sm:text-base text-gray-600">{quote.name} • {quote.customer?.company_name || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content - 3 Column Layout */}
      <div className="w-full h-[calc(100vh-120px)] flex">
        {/* Left Column - Joinery Items List */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Joinery Items</h2>
            <button
              onClick={() => {
                setShowJoineryForm(true)
                setSelectedJoineryItem(null)
              }}
              className="flex items-center justify-center w-6 h-6 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Add new joinery item"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <QuoteJoineryItemsList 
              quoteId={quoteId} 
              compact={true}
              selectedItem={selectedJoineryItem}
              onSelectItem={(item) => {
                setSelectedJoineryItem(item)
                setShowJoineryForm(false)
              }}
            />
          </div>
        </div>

        {/* Middle Column - Selected Joinery Item Details */}
        <div className="flex-1 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <QuoteJoineryItemsList 
            quoteId={quoteId} 
            compact={false}
            selectedItem={selectedJoineryItem}
            onSelectItem={(item) => {
              setSelectedJoineryItem(item)
              setShowJoineryForm(false)
            }}
            showForm={showJoineryForm}
            onFormClose={() => setShowJoineryForm(false)}
          />
        </div>

        {/* Right Column - Quote Total */}
        <div className="w-96 bg-white overflow-y-auto">
          <QuoteJoineryItemsList 
            quoteId={quoteId} 
            compact={false}
            selectedItem={null}
            showTotal={true}
          />
        </div>
      </div>
    </div>
  )
}

