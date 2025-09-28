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
      // Check if admin user exists in database
      const { data: adminExists, error: checkError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('username', credentials.username)
        .single()

      if (!checkError && adminExists) {
        // Admin exists in database - only check database password
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
      } else {
        // Admin doesn't exist in database - use hardcoded fallback
        if (credentials.username === 'admin' && credentials.password === '2004') {
          localStorage.setItem('admin_authenticated', 'true')
          localStorage.setItem('admin_user', JSON.stringify({
            id: 'admin-001',
            username: 'admin'
          }))
          router.push('/admin/dashboard')
          return
        }
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
    <div className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600 flex items-center justify-center p-4 relative">
      {/* Professional Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M50%2050c0-27.614%2022.386-50%2050-50s50%2022.386%2050%2050-22.386%2050-50%2050-50-22.386-50-50zM0%200h100v100H0z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
      
      {/* Subtle geometric shapes for professional look */}
      <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-2xl rotate-12"></div>
      <div className="absolute bottom-10 left-10 w-16 h-16 bg-white/10 rounded-full"></div>
      <div className="absolute top-1/3 left-1/4 w-12 h-12 bg-white/10 rounded-lg rotate-45"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <Link href="/" className="inline-block mb-6 group">
            <div className="mx-auto w-20 h-20 rounded-3xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-sm border border-white/20 group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/irp-logo.jpg"
                alt="IRP Logo"
                width={80}
                height={80}
                className="w-full h-full object-contain p-2"
              />
            </div>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
            Admin Portal
          </h1>
          <p className="text-white/90 text-lg font-medium drop-shadow-md">
            Access the IRP Booking System Admin Panel
          </p>
          <div className="mt-6 p-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl">
            <p className="text-sm text-white font-medium flex items-center justify-center">
              <span className="inline-block w-2 h-2 bg-white rounded-full mr-2"></span>
              Contact system administrator for access credentials
            </p>
          </div>
        </div>

        {/* Admin Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-white mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Admin ID *
              </label>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                placeholder="Enter admin ID"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-blue-600 hover:bg-blue-50 py-4 px-6 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <svg className="ml-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Back to home */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-white/80 hover:text-white text-sm font-medium transition-colors duration-300 flex items-center justify-center group">
              <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
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
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Invalid Credentials</h3>
          <p className="text-gray-600 mb-8 text-lg">{error}</p>
          <button
            onClick={() => setShowErrorModal(false)}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </Modal>
    </div>
  )
}
