'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, FileText, Calendar, DollarSign, User, MapPin } from 'lucide-react'
import { useQuotes, useDeleteQuoteProject } from '@/hooks/useQuoteProjects'
import { QuoteForm } from './QuoteForm'
import { QuoteProject } from '@/lib/supabase'
import Link from 'next/link'

export function QuotesList() {
  const [showForm, setShowForm] = useState(false)
  const [editingQuote, setEditingQuote] = useState<QuoteProject | null>(null)
  const { data: quotes, isLoading } = useQuotes()
  const deleteQuote = useDeleteQuoteProject()

  const handleEdit = (quote: QuoteProject) => {
    setEditingQuote(quote)
    setShowForm(true)
  }

  const handleDelete = async (quote: QuoteProject) => {
    if (confirm(`Are you sure you want to delete quote "${quote.quote_num || quote.name}"?`)) {
      await deleteQuote.mutateAsync(quote.id)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingQuote(null)
  }

  const handleFormSuccess = (quoteId: string) => {
    setShowForm(false)
    setEditingQuote(null)
    // Navigate to quote detail page
    window.location.href = `/quotes/${quoteId}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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

      {/* Quotes List */}
      {quotes && quotes.length > 0 ? (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              onEdit={handleEdit}
              onDelete={handleDelete}
              statusColor={getStatusColor(quote.status || 'draft')}
            />
          ))}
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

function QuoteCard({ 
  quote, 
  onEdit, 
  onDelete,
  statusColor
}: { 
  quote: QuoteProject
  onEdit: (quote: QuoteProject) => void
  onDelete: (quote: QuoteProject) => void
  statusColor: string
}) {
  return (
    <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <Link
              href={quote.id ? `/quotes/${quote.id}` : '#'}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {quote.quote_num || quote.name || 'Quote'}
            </Link>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
              {quote.status || 'draft'}
            </span>
          </div>
          
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            {quote.name}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Customer */}
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <span className="text-sm text-gray-600">Customer:</span>
                <p className="font-medium text-gray-900">{quote.customer?.company_name || '-'}</p>
              </div>
            </div>

            {/* Quote Date */}
            {quote.quote_date && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600">Date:</span>
                  <p className="font-medium text-gray-900">
                    {new Date(quote.quote_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {/* Total Amount */}
            {quote.total_amount && quote.total_amount > 0 && (
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600">Total:</span>
                  <p className="font-medium text-gray-900">
                    ${quote.total_amount.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Address */}
            {quote.address && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600">Address:</span>
                  <p className="font-medium text-gray-900 truncate">{quote.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <Link
            href={`/quotes/${quote.id}`}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="View quote"
          >
            <FileText className="h-4 w-4" />
          </Link>
          <button
            onClick={() => onEdit(quote)}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit quote"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(quote)}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="Delete quote"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

