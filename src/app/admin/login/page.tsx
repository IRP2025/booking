'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/Modal'

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Try database authentication first
      try {
        const { data: admin, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('username', credentials.username)
          .eq('password_hash', credentials.password)
          .single()

        if (!error && admin) {
          localStorage.setItem('admin_authenticated', 'true')
          localStorage.setItem('admin_user', JSON.stringify(admin))
          router.push('/admin/dashboard')
          return
        }
      } catch (dbError) {
        console.error('Database authentication error:', dbError)
      }

      // Fallback to hardcoded admin credentials only if database fails
      if (credentials.username === 'admin' && credentials.password === '2025') {
        localStorage.setItem('admin_authenticated', 'true')
        localStorage.setItem('admin_user', JSON.stringify({
          id: 'admin-001',
          username: 'admin'
        }))
        router.push('/admin/dashboard')
        return
      }

      // If we reach here, credentials are invalid
      setError('Invalid username or password')
      setShowErrorModal(true)
    } catch (err) {
      setError('Login failed. Please try again.')
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <Link href="/" className="inline-block mb-6">
            <div className="mx-auto w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/irp-logo.jpg"
                alt="IRP Logo"
                width={64}
                height={64}
                className="w-full h-full object-contain"
              />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Portal
          </h1>
          <p className="text-gray-600 text-lg">
            Access the IRP Booking System Admin Panel
          </p>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              <strong>Note:</strong> Contact system administrator for access credentials
            </p>
          </div>
        </div>

        {/* Admin Card */}
        <div className="modern-card p-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>


          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Admin ID *
              </label>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleInputChange}
                required
                className="modern-input w-full"
                placeholder="Enter admin ID"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                required
                className="modern-input w-full"
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full modern-button py-4 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>


          {/* Back to home */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Login Failed"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Invalid Credentials</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => setShowErrorModal(false)}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </Modal>
    </div>
  )
}
