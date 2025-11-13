'use client'

import { useState } from 'react'
import { Plus, Edit, FileText } from 'lucide-react'
import { useQuotes } from '@/hooks/useQuoteProjects'
import { QuoteForm } from './QuoteForm'
import { QuoteProject } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function QuotesList() {
  const [showForm, setShowForm] = useState(false)
  const [editingQuote, setEditingQuote] = useState<QuoteProject | null>(null)
  const { data: quotes, isLoading, error } = useQuotes()
  const router = useRouter()

  const handleEdit = (e: React.MouseEvent, quote: QuoteProject) => {
    e.stopPropagation() // Prevent row click
    setEditingQuote(quote)
    setShowForm(true)
  }

  const handleRowClick = (quoteId: string) => {
    router.push(`/quotes/${quoteId}`)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingQuote(null)
  }

  const handleFormSuccess = (quoteId: string) => {
    setShowForm(false)
    setEditingQuote(null)
    // Don't navigate - just close the form and refresh the list
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading quotes</p>
          <p className="text-sm text-gray-600">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Quotes</h3>
          <p className="text-sm text-gray-600">Create and manage project quotes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create Quote</span>
        </button>
      </div>

      {/* Quotes List - Table Format */}
      {quotes && quotes.length > 0 ? (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quote Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project / Client
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quote Sell Value
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotes.map((quote) => (
                <tr
                  key={quote.id}
                  onClick={() => handleRowClick(quote.id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {quote.quote_num || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">
                      {quote.name || '-'} {quote.customer?.company_name ? `- ${quote.customer.company_name}` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      ${quote.total_amount ? quote.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <button
                      onClick={(e) => handleEdit(e, quote)}
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      title="Edit quote"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FileText className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes yet</h3>
          <p className="text-gray-500 mb-4">Create your first quote to get started.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Quote</span>
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <QuoteForm
          quote={editingQuote || undefined}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}

