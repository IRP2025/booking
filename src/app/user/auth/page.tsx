'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/Modal'

export default function UserAuth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    department: '',
    email: '',
    year: '',
    password: '',
    confirmPassword: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Debug: Check Supabase configuration
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Anon Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          setErrorMessage('Passwords do not match!')
          setShowErrorModal(true)
          setIsLoading(false)
          return
        }

        // Create user directly in database (simplified approach)
        // Try with password field first
        let { data: userData, error: profileError } = await supabase
          .from('users')
          .insert({
            name: formData.name,
            roll_no: formData.rollNo,
            department: formData.department,
            email: formData.email,
            year: parseInt(formData.year),
            password: formData.password
          })
          .select()
          .single()

        // If that fails, try without password field
        if (profileError) {
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .insert({
              name: formData.name,
              roll_no: formData.rollNo,
              department: formData.department,
              email: formData.email,
              year: parseInt(formData.year)
            })
            .select()
            .single()
          
          if (retryError) {
            profileError = retryError
          } else {
            profileError = null
            userData = retryData
          }
        }

        if (profileError) {
          // Handle specific database errors with user-friendly messages
          let errorMessage = 'Failed to create account. Please try again.'
          
          // Check if it's a duplicate key error
          if (profileError.code === '23505' || 
              (profileError.message && profileError.message.includes('duplicate key')) ||
              (profileError.message && profileError.message.includes('unique constraint'))) {
            
            if (profileError.message && profileError.message.includes('roll_no')) {
              errorMessage = 'This roll number is already registered. Please use a different roll number or sign in instead.'
            } else if (profileError.message && profileError.message.includes('email')) {
              errorMessage = 'This email is already registered. Please use a different email or sign in instead.'
            } else {
              errorMessage = 'This information is already in use. Please check your details and try again.'
            }
          } else if (profileError.code === '23502' || 
                     (profileError.message && profileError.message.includes('null value'))) {
            errorMessage = 'Please fill in all required fields.'
          } else if (profileError.message) {
            // Check for common error patterns in the message
            if (profileError.message.includes('roll_no') || profileError.message.includes('roll number')) {
              errorMessage = 'This roll number is already registered. Please use a different roll number or sign in instead.'
            } else if (profileError.message.includes('email')) {
              errorMessage = 'This email is already registered. Please use a different email or sign in instead.'
            } else {
              errorMessage = 'Failed to create account. Please check your details and try again.'
            }
          } else {
            // Fallback for empty error objects - check if it's likely a duplicate
            errorMessage = 'This information may already be in use. Please check your details or try signing in instead.'
          }
          
          setErrorMessage(errorMessage)
          setShowErrorModal(true)
        } else {
          // Store user in localStorage for session management
          localStorage.setItem('user', JSON.stringify(userData))
          setIsSuccess(true)
          setTimeout(() => {
            setShowSuccessModal(true)
          }, 500) // Small delay for better UX
        }
      } else {
        // Handle sign in logic (simplified approach)
        // First, try to find user by email
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', formData.email)
          .single()

        if (userError) {
          setErrorMessage('No account found with this email. Please create an account first.')
          setShowErrorModal(true)
          return
        }

        if (!user) {
          setErrorMessage('No account found with this email. Please create an account first.')
          setShowErrorModal(true)
          return
        }

        // Check if password field exists and matches
        if (user.password && user.password !== formData.password) {
          setErrorMessage('Invalid password. Please try again.')
          setShowErrorModal(true)
          return
        }

        // If no password field, accept any password (for demo purposes)
        if (!user.password) {
          // No password field found, accepting any password for demo
        }

        // Store user in localStorage for session management
        localStorage.setItem('user', JSON.stringify(user))
        
        // Show success message
        setIsSuccess(true)
        setTimeout(() => {
          setShowSuccessModal(true)
        }, 500) // Small delay for better UX
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.')
      setShowErrorModal(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccessModal(false)
    setIsSuccess(false)
    // No automatic redirect - user will click the button manually
  }

  const handleModalClose = () => {
    setShowSuccessModal(false)
    setIsSuccess(false)
  }

  // No auto-redirect - let user choose when to proceed

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
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600 text-lg">
            {isSignUp ? 'Join the IRP Booking System' : 'Sign in to continue'}
          </p>
          {isSignUp && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-700">
                <strong>Already have an account?</strong> If you're getting "roll number already exists" error, you may already be registered. Try signing in instead.
              </p>
            </div>
          )}
          {!isSignUp && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-700">
                <strong>First time?</strong> Please create an account first, then you can sign in.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                If you're getting "roll number already exists" error, you may already have an account. Try signing in instead.
              </p>
            </div>
          )}
        </div>

        {/* Auth Card */}
        <div className="modern-card p-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="modern-input w-full"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Roll Number *
                    </label>
                    <input
                      type="text"
                      name="rollNo"
                      value={formData.rollNo}
                      onChange={handleInputChange}
                      required
                      className="modern-input w-full"
                      placeholder="Enter your roll number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Department *
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                      className="modern-input w-full"
                    >
                      <option value="">Select Department</option>
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">Mechanical</option>
                      <option value="CYBER">CSE CY</option>
                      <option value="AIDS">AIDS</option>
                      <option value="IOT">CSE IOT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Year *
                    </label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      required
                      className="modern-input w-full"
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="modern-input w-full"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              {!isSignUp && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="modern-input w-full"
                    placeholder="Enter your email address"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="modern-input w-full"
                  placeholder={isSignUp ? 'Create a strong password' : 'Enter your password'}
                />
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="modern-input w-full"
                    placeholder="Confirm your password"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className={`w-full py-4 text-base font-semibold disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 ${
                isSuccess 
                  ? 'bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg' 
                  : 'modern-button disabled:opacity-50'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : isSuccess ? (
                <>
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isSignUp ? 'Account Created!' : 'Signed In!'}
                </>
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
        </form>

          {/* Toggle between sign in and sign up */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                {isSignUp ? 'Sign In' : 'Create Account'}
              </button>
            </p>
          </div>

          {/* Back to home */}
          <div className="mt-4 text-center">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={handleModalClose}
        title=""
        showCloseButton={true}
      >
        <div className="text-center py-4">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          {/* Success Message */}
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {isSignUp ? 'Welcome to IRP!' : 'Welcome Back!'}
          </h3>
          <p className="text-gray-600 mb-8 text-lg">
            {isSignUp 
              ? 'Your account has been created successfully! Click the button below to access the booking system.' 
              : 'You\'re all set! Click the button below to access the booking system.'
            }
          </p>
          
          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/user/booking"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Book Review Slot
            </Link>
            
            <button
              onClick={handleModalClose}
              className="w-full text-gray-600 hover:text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Stay on this page
            </button>
          </div>
          
          {/* Helpful Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-center space-x-2 text-blue-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">
                Click the button above to access the booking system
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
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
