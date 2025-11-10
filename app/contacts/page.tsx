'use client'

import { useState } from 'react'
import { Users, Building, Package } from 'lucide-react'
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers'
import { useSuppliers, useDeleteSupplier } from '@/hooks/useSuppliers'
import { CustomerForm } from '@/components/contacts/CustomerForm'
import { SupplierForm } from '@/components/contacts/SupplierForm'
import { Customer, Supplier } from '@/lib/supabase'

type TabType = 'customers' | 'suppliers'

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('customers')
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  const { data: customers, isLoading: customersLoading } = useCustomers()
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers()
  const deleteCustomer = useDeleteCustomer()
  const deleteSupplier = useDeleteSupplier()

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setShowCustomerForm(true)
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    if (confirm(`Are you sure you want to delete customer "${customer.company_name}"?`)) {
      try {
        await deleteCustomer.mutateAsync(customer.id)
      } catch (error: any) {
        console.error('Error deleting customer:', error)
        const errorMessage = error?.message || error?.error_description || error?.details || 'Failed to delete customer. Please try again.'
        alert(`Error deleting customer: ${errorMessage}`)
      }
    }
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setShowSupplierForm(true)
  }

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (confirm(`Are you sure you want to delete supplier "${supplier.name}"?`)) {
      try {
        await deleteSupplier.mutateAsync(supplier.id)
      } catch (error: any) {
        console.error('Error deleting supplier:', error)
        const errorMessage = error?.message || error?.error_description || error?.details || 'Failed to delete supplier. Please try again.'
        alert(`Error deleting supplier: ${errorMessage}`)
      }
    }
  }

  const handleCustomerFormClose = () => {
    setShowCustomerForm(false)
    setEditingCustomer(null)
  }

  const handleSupplierFormClose = () => {
    setShowSupplierForm(false)
    setEditingSupplier(null)
  }

  const handleCustomerFormSuccess = () => {
    setShowCustomerForm(false)
    setEditingCustomer(null)
  }

  const handleSupplierFormSuccess = () => {
    setShowSupplierForm(false)
    setEditingSupplier(null)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6 pt-12 sm:pt-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contacts</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage customers and suppliers</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('customers')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'customers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building className="h-4 w-4" />
                <span>Customers</span>
              </button>
              <button
                onClick={() => setActiveTab('suppliers')}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'suppliers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="h-4 w-4" />
                <span>Suppliers</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Customers</h2>
                <p className="text-sm text-gray-600">Manage your customer database</p>
              </div>
              <button
                onClick={() => setShowCustomerForm(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Users className="h-4 w-4" />
                <span>Add Customer</span>
              </button>
            </div>

            {customersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : customers && customers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mobile
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.company_name}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {customer.contact_name || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {customer.email}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {customer.phone || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {customer.mobile || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {customer.address || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditCustomer(customer)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Edit customer"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(customer)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete customer"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h3>
                <p className="text-gray-500 mb-4">Add your first customer to get started.</p>
                <button
                  onClick={() => setShowCustomerForm(true)}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Users className="h-4 w-4" />
                  <span>Add First Customer</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Suppliers</h2>
                <p className="text-sm text-gray-600">Manage your supplier database</p>
              </div>
              <button
                onClick={() => setShowSupplierForm(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Package className="h-4 w-4" />
                <span>Add Supplier</span>
              </button>
            </div>

            {suppliersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : suppliers && suppliers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Info
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {supplier.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {supplier.contact_info || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {supplier.email || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {supplier.phone || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {supplier.address || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {supplier.notes || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditSupplier(supplier)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Edit supplier"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteSupplier(supplier)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete supplier"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers yet</h3>
                <p className="text-gray-500 mb-4">Add your first supplier to get started.</p>
                <button
                  onClick={() => setShowSupplierForm(true)}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Package className="h-4 w-4" />
                  <span>Add First Supplier</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Forms */}
        {showCustomerForm && (
          <CustomerForm
            customer={editingCustomer || undefined}
            onClose={handleCustomerFormClose}
            onSuccess={handleCustomerFormSuccess}
          />
        )}

        {showSupplierForm && (
          <SupplierForm
            supplier={editingSupplier || undefined}
            onClose={handleSupplierFormClose}
            onSuccess={handleSupplierFormSuccess}
          />
        )}
      </div>
    </div>
  )
}

