'use client'

import { useState } from 'react'
import { X, Save, Calendar } from 'lucide-react'
import { useCreateQuoteProject, useUpdateQuoteProject } from '@/hooks/useQuoteProjects'
import { useCustomers } from '@/hooks/useCustomers'
import { QuoteProject } from '@/lib/supabase'

interface QuoteFormProps {
  quote?: QuoteProject
  onClose: () => void
  onSuccess: (quoteId: string) => void // Pass quote ID to navigate to detail page
}

export function QuoteForm({ quote, onClose, onSuccess }: QuoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createQuote = useCreateQuoteProject()
  const updateQuote = useUpdateQuoteProject()
  const { data: customers = [] } = useCustomers()
  const isEditing = !!quote

  const [formData, setFormData] = useState({
    quote_num: quote?.quote_num || '',
    name: quote?.name || '',
    customer_id: quote?.customer_id || '',
    address: quote?.address || '',
    quote_date: quote?.quote_date 
      ? new Date(quote.quote_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    valid_until: quote?.valid_until 
      ? new Date(quote.valid_until).toISOString().split('T')[0]
      : '',
    status: quote?.status || 'draft',
    description: quote?.description || '',
    total_amount: quote?.total_amount || 0,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.quote_num.trim()) {
      newErrors.quote_num = 'Quote number is required'
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    }
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    try {
      const quoteData = {
        quote: true, // This is a quote
        quote_num: formData.quote_num.trim() || null,
        name: formData.name.trim(),
        customer_id: formData.customer_id,
        address: formData.address.trim() || null,
        quote_date: formData.quote_date || null,
        valid_until: formData.valid_until || null,
        status: formData.status || 'draft',
        description: formData.description.trim() || null,
        total_amount: formData.total_amount || 0,
        budget: 0, // Quotes don't have budget, but field is required
        proj_num: null, // Quotes don't have project number
        install_commencement_date: null,
        install_duration: null,
        priority_level: null,
        markup_percentage: 40, // Default markup percentage
        created_by: null, // TODO: Get from auth context when available
      }

      console.log('Creating/updating quote with data:', quoteData)

      if (isEditing && quote) {
        await updateQuote.mutateAsync({
          id: quote.id,
          ...quoteData,
        })
        onSuccess(quote.id)
      } else {
        const newQuote = await createQuote.mutateAsync(quoteData)
        onSuccess(newQuote.id)
      }
    } catch (error: any) {
      console.error('Error saving quote:', error)
      console.error('Error details:', error?.message || error?.error_description || JSON.stringify(error, null, 2))
      const errorMessage = error?.message || error?.error_description || error?.details || 'Failed to save quote. Please try again.'
      if (error?.code === '23505') { // Unique constraint violation
        setErrors({ quote_num: 'Quote number already exists' })
      } else {
        setErrors({ submit: errorMessage })
        alert(`Error saving quote: ${errorMessage}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Quote' : 'Create New Quote'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quote Number */}
          <div>
            <label htmlFor="quote_num" className="block text-sm font-medium text-gray-700 mb-1">
              Quote Number *
            </label>
            <input
              type="text"
              id="quote_num"
              value={formData.quote_num}
              onChange={(e) => handleChange('quote_num', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.quote_num ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Q-2024-001"
            />
            {errors.quote_num && (
              <p className="text-red-500 text-sm mt-1">{errors.quote_num}</p>
            )}
          </div>

          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Kitchen Renovation"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Customer */}
          <div>
            <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-1">
              Customer *
            </label>
            <select
              id="customer_id"
              value={formData.customer_id}
              onChange={(e) => handleChange('customer_id', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.customer_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a customer...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.company_name}
                </option>
              ))}
            </select>
            {errors.customer_id && (
              <p className="text-red-500 text-sm mt-1">{errors.customer_id}</p>
            )}
            {!customers || customers.length === 0 && (
              <p className="text-gray-500 text-sm mt-1">No customers available. Please create a customer first.</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Project Address
            </label>
            <textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Project address"
            />
          </div>

          {/* Quote Date and Valid Until */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quote_date" className="block text-sm font-medium text-gray-700 mb-1">
                Quote Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="quote_date"
                  value={formData.quote_date}
                  onChange={(e) => handleChange('quote_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="valid_until" className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="valid_until"
                  value={formData.valid_until}
                  onChange={(e) => handleChange('valid_until', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Description/Notes */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description / Notes
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes or comments"
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <p className="text-red-500 text-sm">{errors.submit}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create Quote')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

