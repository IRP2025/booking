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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Professional Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%236366f1%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221.5%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      
      {/* Subtle geometric elements */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-xl"></div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-8 group">
            <div className="mx-auto w-20 h-20 rounded-3xl overflow-hidden shadow-2xl bg-white/80 backdrop-blur-sm border border-white/20 group-hover:scale-105 transition-all duration-300">
              <Image
                src="/irp-logo.jpg"
                alt="IRP Logo"
                width={80}
                height={80}
                className="w-full h-full object-contain p-2"
              />
            </div>
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600 text-lg font-medium">
            {isSignUp ? 'Join the IRP Booking System' : 'Sign in to continue'}
          </p>
          
          {/* Status Messages */}
          {isSignUp && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <p className="text-sm text-green-700 font-medium">
                  <strong>Already have an account?</strong> Try signing in instead.
                </p>
              </div>
            </div>
          )}
          {!isSignUp && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <p className="text-sm text-blue-700 font-medium">
                  <strong>First time?</strong> Create an account to get started.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl">

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 font-medium"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Roll Number *
                    </label>
                    <input
                      type="text"
                      name="rollNo"
                      value={formData.rollNo}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 font-medium"
                      placeholder="Enter your roll number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Department *
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 font-medium"
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

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Year *
                    </label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 font-medium"
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 font-medium"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
            )}

            <div className="space-y-6">
              {!isSignUp && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 font-medium"
                    placeholder="Enter your email address"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 font-medium"
                  placeholder={isSignUp ? 'Create a strong password' : 'Enter your password'}
                />
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 font-medium"
                    placeholder="Confirm your password"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg ${
                isSuccess 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-50'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : isSuccess ? (
                <>
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isSignUp ? 'Account Created!' : 'Signed In!'}
                </>
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <svg className="ml-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div className="mt-8 text-center">
            <div className="bg-gray-50 rounded-2xl p-6">
              <p className="text-gray-600 text-sm font-medium mb-3">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </p>
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setFormData({
                    name: '',
                    rollNo: '',
                    department: '',
                    email: '',
                    year: '',
                    password: '',
                    confirmPassword: ''
                  })
                  setErrorMessage('')
                }}
                className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105 shadow-md border border-blue-200"
              >
                {isSignUp ? 'Sign In Instead' : 'Create Account Instead'}
              </button>
            </div>
          </div>

          {/* Back to home */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors duration-300 flex items-center justify-center group">
              <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
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
