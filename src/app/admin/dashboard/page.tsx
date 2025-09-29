'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Booking {
  id: string
  user: {
    name: string
    rollNo: string
    department: string
    email: string
  }
  slotDate: string
  slotTime: string
  projectName: string
  venue: string
  teamLeadName: string
  teamLeadRollNo: string
  createdAt: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [systemActive, setSystemActive] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminSlots, setAdminSlots] = useState<any[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [autoDeactivate, setAutoDeactivate] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [timerActive, setTimerActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [timerEndTime, setTimerEndTime] = useState<Date | null>(null)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showBookingDetail, setShowBookingDetail] = useState(false)

  // Fetch real bookings data from Supabase
  const fetchBookings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          slot_date,
          slot_time,
          created_at,
          users!inner(
            name,
            roll_no,
            department,
            email,
            team_lead_name,
            team_lead_roll_no,
            project_name,
            venue
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching bookings:', error)
        return
      }

      const formattedBookings: Booking[] = data?.map(booking => ({
        id: booking.id,
        user: {
          name: (booking.users as any)?.name || '',
          rollNo: (booking.users as any)?.roll_no || '',
          department: (booking.users as any)?.department || '',
          email: (booking.users as any)?.email || ''
        },
        slotDate: booking.slot_date,
        slotTime: booking.slot_time,
        projectName: (booking.users as any)?.project_name || '',
        venue: (booking.users as any)?.venue || '',
        teamLeadName: (booking.users as any)?.team_lead_name || '',
        teamLeadRollNo: (booking.users as any)?.team_lead_roll_no || '',
        createdAt: booking.created_at
      })) || []

      setBookings(formattedBookings)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch admin slots data for visual management
  const fetchAdminSlots = async () => {
    try {
      setAdminLoading(true)
      
      const dates = ['2025-10-06', '2025-10-07', '2025-10-08', '2025-10-09', '2025-10-10']
      const times = [
        { id: '1', time: '1:45 PM - 2:15 PM' },
        { id: '2', time: '2:15 PM - 2:45 PM' },
        { id: '3', time: '2:45 PM - 3:15 PM' },
        { id: '4', time: '3:15 PM - 3:45 PM' }
      ]

      // Get all bookings
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          slot_date,
          slot_time,
          users!inner(name, project_name, team_lead_name, team_lead_roll_no)
        `)

      if (error) {
        console.error('Error fetching admin slots:', error)
        return
      }

      // Create a map of booked slots
      const bookedSlots = new Map()
      bookings?.forEach(booking => {
        const key = `${booking.slot_date}-${booking.slot_time}`
        bookedSlots.set(key, {
          bookingId: booking.id,
          bookedBy: (booking.users as any)?.name || 'Unknown',
          projectName: (booking.users as any)?.project_name || 'Unknown',
          teamLeadName: (booking.users as any)?.team_lead_name || 'Unknown',
          teamLeadRollNo: (booking.users as any)?.team_lead_roll_no || 'Unknown'
        })
      })

      // Generate all slots with booking status
      const allSlots: any[] = []
      dates.forEach(date => {
        times.forEach(time => {
          const key = `${date}-${time.time}`
          const bookingInfo = bookedSlots.get(key)
          
          allSlots.push({
            id: `${date}-${time.id}`,
            date,
            time: time.time,
            isAvailable: !bookingInfo,
            bookingInfo: bookingInfo || null
          })
        })
      })

      setAdminSlots(allSlots)
    } catch (error) {
      console.error('Error fetching admin slots:', error)
    } finally {
      setAdminLoading(false)
    }
  }

  // Load system status from database
  const loadSystemStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('system_active, auto_deactivate_at')
        .single()

      if (!error && data) {
        setSystemActive(data.system_active)
        
        // Check if there's an active timer
        if (data.auto_deactivate_at) {
          const endTime = new Date(data.auto_deactivate_at)
          const now = new Date()
          
          if (endTime > now) {
            setTimerActive(true)
            setTimerEndTime(endTime)
            setTimeRemaining(Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000)))
          } else {
            // Timer has expired, deactivate system
            setSystemActive(false)
            setTimerActive(false)
            setTimeRemaining(0)
            setTimerEndTime(null)
          }
        }
      }
    } catch (error) {
      console.error('Error loading system status:', error)
    }
  }

  // Check admin authentication
  useEffect(() => {
    const adminAuth = localStorage.getItem('admin_authenticated')
    if (adminAuth === 'true') {
      setIsAuthenticated(true)
    } else {
      router.push('/admin/login')
    }
  }, [router])

  useEffect(() => {
    if (isAuthenticated) {
      loadSystemStatus()
      fetchBookings()
      fetchAdminSlots()
    }
  }, [isAuthenticated])

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (timerActive && timerEndTime) {
      interval = setInterval(() => {
        const now = new Date()
        const remaining = Math.max(0, Math.floor((timerEndTime.getTime() - now.getTime()) / 1000))
        
        setTimeRemaining(remaining)
        
        if (remaining <= 0) {
          // Timer expired, deactivate system
          handleTimerExpired()
        }
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [timerActive, timerEndTime])

  // Handle timer expiration
  const handleTimerExpired = async () => {
    try {
      // Deactivate system in database
      await supabase
        .from('admin_settings')
        .update({ 
          system_active: false,
          auto_deactivate_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', '3edba1fd-7199-472b-9dd8-710f271ddd95')

      setSystemActive(false)
      setTimerActive(false)
      setTimeRemaining(0)
      setTimerEndTime(null)
    } catch (error) {
      console.error('Error deactivating system:', error)
    }
  }


  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated')
    localStorage.removeItem('admin_user')
    router.push('/admin/login')
  }

  // Remove user booking
  const removeBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)

      if (error) {
        console.error('Error removing booking:', error)
        return
      }

      // Refresh data
      await fetchBookings()
      await fetchAdminSlots()
    } catch (error) {
      console.error('Error removing booking:', error)
    }
  }

  // Handle booking detail view
  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowBookingDetail(true)
  }

  const closeBookingDetail = () => {
    setShowBookingDetail(false)
    setSelectedBooking(null)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Format time remaining for display
  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    try {
      // Check if admin user exists in database
      const { data: admin, error: fetchError } = await supabase
        .from('admin_users')
        .select('password_hash')
        .eq('username', 'admin')
        .single()

      let currentValidPassword = '2004' // Default hardcoded password

      if (!fetchError && admin) {
        // Admin exists in database - use database password
        currentValidPassword = admin.password_hash
      }

      // Check current password - only allow the current valid password
      if (currentPassword !== currentValidPassword) {
        setPasswordError('Current password is incorrect')
        return
      }

      if (newPassword !== confirmPassword) {
        setPasswordError('New passwords do not match')
        return
      }

      if (newPassword.length < 4) {
        setPasswordError('Password must be at least 4 characters')
        return
      }

      // Update or create the admin user in the database
      if (!fetchError && admin) {
        // Update existing admin user
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({ 
            password_hash: newPassword,
            updated_at: new Date().toISOString()
          })
          .eq('username', 'admin')

        if (updateError) {
          setPasswordError('Failed to update password. Please try again.')
          return
        }
      } else {
        // Create new admin user
        const { error: insertError } = await supabase
          .from('admin_users')
          .insert({
            username: 'admin',
            password_hash: newPassword,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          setPasswordError('Failed to create admin user. Please try again.')
          return
        }
      }

      setPasswordSuccess('Password changed successfully! You will be logged out in 3 seconds...')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // Auto logout after 3 seconds
      setTimeout(() => {
        handleLogout()
      }, 3000)
    } catch (error) {
      console.error('Password change error:', error)
      setPasswordError('An error occurred while changing password')
    }
  }

  const handleSystemToggle = async () => {
    try {
      const newStatus = !systemActive
      
      // Update the database
      const { error } = await supabase
        .from('admin_settings')
        .update({ 
          system_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', '3edba1fd-7199-472b-9dd8-710f271ddd95') // Use the actual ID from the database

      if (error) {
        console.error('Error updating system status:', error)
        return
      }

      // Update local state only after successful database update
      setSystemActive(newStatus)
    } catch (error) {
      console.error('Error toggling system status:', error)
    }
  }

  const handleAutoDeactivate = async () => {
    if (autoDeactivate) {
      const minutes = parseInt(autoDeactivate)
      if (minutes <= 0) {
        alert('Please enter a valid number of minutes')
        return
      }

      const deactivateTime = new Date(Date.now() + minutes * 60 * 1000)
      
      try {
        // Set timer in database
        const { error } = await supabase
          .from('admin_settings')
          .update({ 
            auto_deactivate_at: deactivateTime.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', '3edba1fd-7199-472b-9dd8-710f271ddd95')

        if (error) {
          console.error('Error setting timer:', error)
          alert('Failed to set timer. Please try again.')
          return
        }

        // Update local state
        setTimerActive(true)
        setTimerEndTime(deactivateTime)
        setTimeRemaining(minutes * 60)
        setAutoDeactivate('')
        
        alert(`Timer set! System will deactivate in ${minutes} minutes at ${deactivateTime.toLocaleString()}`)
      } catch (error) {
        console.error('Error setting timer:', error)
        alert('Failed to set timer. Please try again.')
      }
    }
  }

  // Cancel timer function
  const handleCancelTimer = async () => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({ 
          auto_deactivate_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', '3edba1fd-7199-472b-9dd8-710f271ddd95')

      if (error) {
        console.error('Error canceling timer:', error)
        return
      }

      setTimerActive(false)
      setTimeRemaining(0)
      setTimerEndTime(null)
    } catch (error) {
      console.error('Error canceling timer:', error)
    }
  }

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-6"></div>
          <p className="text-white text-xl font-medium">Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg shadow-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 p-1 group-hover:scale-105 transition-transform duration-300">
                  <Image
                    src="/irp-logo.jpg"
                    alt="IRP Logo"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
                <div className="ml-3 sm:ml-4">
                  <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    IRP Admin Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500">Booking System Management</p>
                </div>
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex flex-wrap gap-2 sm:gap-4">
                <div className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg ${
                  systemActive 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                    : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                }`}>
                  <span className="mr-1 sm:mr-2">{systemActive ? '✅' : '❌'}</span>
                  <span className="hidden sm:inline">{systemActive ? 'System Active' : 'System Inactive'}</span>
                  <span className="sm:hidden">{systemActive ? 'Active' : 'Inactive'}</span>
                </div>
                {timerActive && (
                  <div className="px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg">
                    <span className="mr-1 sm:mr-2">⏰</span>
                    <span className="hidden sm:inline">Auto-deactivate in: {formatTimeRemaining(timeRemaining)}</span>
                    <span className="sm:hidden">{formatTimeRemaining(timeRemaining)}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                <span className="mr-1 sm:mr-2">🚪</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 mb-8 overflow-hidden">
          <nav className="flex flex-wrap sm:flex-nowrap space-x-1 p-2 gap-1 sm:gap-0">
            {[
              { id: 'overview', name: 'Overview', shortName: 'Overview', icon: '📊', color: 'from-blue-500 to-cyan-500' },
              { id: 'bookings', name: 'All Bookings', shortName: 'Bookings', icon: '📅', color: 'from-green-500 to-emerald-500' },
              { id: 'slots', name: 'Visual Slots', shortName: 'Slots', icon: '🎯', color: 'from-purple-500 to-pink-500' },
              { id: 'settings', name: 'System Settings', shortName: 'Settings', icon: '⚙️', color: 'from-orange-500 to-red-500' },
              { id: 'password', name: 'Change Password', shortName: 'Password', icon: '🔒', color: 'from-gray-500 to-slate-500' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-none py-3 sm:py-4 px-3 sm:px-6 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <span className="text-sm sm:text-lg">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden text-xs">{tab.shortName}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading data...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-6 sm:p-8 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-xs sm:text-sm font-bold uppercase tracking-wider">Total Bookings</p>
                        <p className="text-3xl sm:text-4xl font-bold mt-2">{bookings.length}</p>
                        <p className="text-blue-200 text-xs sm:text-sm mt-1">All time bookings</p>
                      </div>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <span className="text-2xl sm:text-3xl">📅</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 sm:p-8 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-300 ${
                    systemActive 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                      : 'bg-gradient-to-br from-red-500 to-pink-500'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-xs sm:text-sm font-bold uppercase tracking-wider">System Status</p>
                        <p className="text-3xl sm:text-4xl font-bold mt-2">{systemActive ? 'Active' : 'Inactive'}</p>
                        <p className="text-white/80 text-xs sm:text-sm mt-1">
                          <span className="hidden sm:inline">{systemActive ? 'System is running' : 'System is disabled'}</span>
                          <span className="sm:hidden">{systemActive ? 'Running' : 'Disabled'}</span>
                        </p>
                      </div>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <span className="text-2xl sm:text-3xl">{systemActive ? '✅' : '❌'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 sm:p-8 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-300 sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-xs sm:text-sm font-bold uppercase tracking-wider">Unique Users</p>
                        <p className="text-3xl sm:text-4xl font-bold mt-2">
                          {new Set(bookings.map(b => b.user.rollNo)).size}
                        </p>
                        <p className="text-purple-200 text-xs sm:text-sm mt-1">
                          <span className="hidden sm:inline">Registered students</span>
                          <span className="sm:hidden">Students</span>
                        </p>
                      </div>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <span className="text-2xl sm:text-3xl">👥</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-4 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      Recent Bookings
                    </h3>
                    <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-sm font-bold self-start sm:self-auto">
                      {bookings.slice(0, 5).length} Recent
                    </div>
                  </div>
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            User Details
                          </th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                            Slot Information
                          </th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                            Project Details
                          </th>
                          <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                            Booked At
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bookings.slice(0, 5).map((booking, index) => (
                          <tr 
                            key={booking.id} 
                            className="hover:bg-blue-50 cursor-pointer transition-all duration-200 hover:shadow-md"
                            onClick={() => handleBookingClick(booking)}
                          >
                            <td className="px-4 sm:px-6 py-6">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 sm:mr-4">
                                  {booking.user.name.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-bold text-gray-900 truncate">
                                    {booking.user.name}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-500 truncate">
                                    {booking.user.rollNo} • {booking.user.department}
                                  </div>
                                  <div className="text-xs text-gray-400 sm:hidden mt-1">
                                    {formatDate(booking.slotDate)} • {booking.slotTime}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-6 whitespace-nowrap hidden sm:table-cell">
                              <div className="text-sm font-medium text-gray-900">
                                {formatDate(booking.slotDate)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {booking.slotTime}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-6 whitespace-nowrap hidden lg:table-cell">
                              <div className="text-sm font-medium text-gray-900">
                                {booking.projectName}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-6 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                              {formatDate(booking.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">All Bookings</h3>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading bookings...</span>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slot Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map(booking => (
                    <tr 
                      key={booking.id} 
                      className="hover:bg-blue-50 cursor-pointer transition-all duration-200 hover:shadow-md"
                      onClick={() => handleBookingClick(booking)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.user.rollNo} • {booking.user.department}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(booking.slotDate)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.slotTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {booking.projectName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Lead: {booking.teamLeadName} ({booking.teamLeadRollNo})
                        </div>
                        <div className="text-sm text-blue-600 font-medium">
                          Venue: {booking.venue}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleBookingClick(booking)
                            }}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            View Details
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeBooking(booking.id)
                            }}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {/* Visual Slots Tab */}
        {activeTab === 'slots' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Visual Slot Management</h3>
              <p className="text-gray-600">Manage booking slots visually - click on booked slots to remove them</p>
            </div>

            {adminLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading slots...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                  {['2025-10-06', '2025-10-07', '2025-10-08', '2025-10-09', '2025-10-10'].map(date => (
                    <div key={date} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                      <h3 className="font-bold text-xl mb-6 text-center text-gray-800">
                        {formatDate(date)}
                      </h3>
                      <div className="space-y-3">
                        {adminSlots
                          .filter(slot => slot.date === date)
                          .map(slot => (
                            <div
                              key={slot.id}
                              className={`p-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                                slot.isAvailable
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : 'bg-red-100 text-red-800 border border-red-200 cursor-pointer hover:bg-red-200'
                              }`}
                              onClick={() => !slot.isAvailable && slot.bookingInfo && removeBooking(slot.bookingInfo.bookingId)}
                            >
                              <div className="text-center">
                                <div className="font-semibold">{slot.time}</div>
                                {!slot.isAvailable && slot.bookingInfo && (
                                  <div className="text-xs mt-2 space-y-1">
                                    <div className="font-medium">Booked by: {slot.bookingInfo.bookedBy}</div>
                                    <div className="text-gray-600">Project: {slot.bookingInfo.projectName}</div>
                                    <div className="text-gray-600">Lead: {slot.bookingInfo.teamLeadName}</div>
                                    <div className="text-red-600 font-medium mt-2">Click to remove</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center gap-8">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Available</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Booked (Click to remove)</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center mb-6 sm:mb-8 gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mr-0 sm:mr-4">
                  <span className="text-xl sm:text-2xl">⚙️</span>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    System Control
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">Manage system settings and controls</p>
                </div>
              </div>
              
              <div className="space-y-6 sm:space-y-8">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">System Status</h4>
                      <p className="text-sm sm:text-base text-gray-600 mb-4">
                        Control whether users can book slots in the system
                      </p>
                      <div className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold ${
                        systemActive 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                          : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                      }`}>
                        <span className="mr-1 sm:mr-2">{systemActive ? '✅' : '❌'}</span>
                        <span className="hidden sm:inline">{systemActive ? 'System is Active' : 'System is Inactive'}</span>
                        <span className="sm:hidden">{systemActive ? 'System Active' : 'System Inactive'}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleSystemToggle}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 transform hover:scale-105 flex-shrink-0 ${
                        systemActive ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                          systemActive ? 'translate-x-9' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center mb-4 gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-0 sm:mr-3">
                      <span className="text-lg sm:text-xl">⏰</span>
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-gray-900">Auto Deactivate Timer</h4>
                      <p className="text-sm sm:text-base text-gray-600">Set a timer to automatically deactivate the system</p>
                    </div>
                  </div>
                  
                  {timerActive ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl p-4 sm:p-6 text-white">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-orange-100 text-xs sm:text-sm font-bold uppercase tracking-wider">Timer Active</p>
                            <p className="text-2xl sm:text-3xl font-bold mt-2">
                              {formatTimeRemaining(timeRemaining)}
                            </p>
                            <p className="text-orange-100 text-xs sm:text-sm mt-1">
                              System will deactivate automatically
                            </p>
                          </div>
                          <div className="text-3xl sm:text-4xl">⏰</div>
                        </div>
                      </div>
                      <button
                        onClick={handleCancelTimer}
                        className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        Cancel Timer
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <input
                        type="number"
                        value={autoDeactivate}
                        onChange={(e) => setAutoDeactivate(e.target.value)}
                        placeholder="Enter minutes"
                        min="1"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                      />
                      <button
                        onClick={handleAutoDeactivate}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 sm:px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        Set Timer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Tab */}
        {activeTab === 'password' && (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-slate-500 rounded-2xl flex items-center justify-center mr-4">
                <span className="text-2xl">🔒</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Change Password
                </h3>
                <p className="text-gray-600">Update your admin account password</p>
              </div>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-6 max-w-lg">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  placeholder="Enter current password"
                />
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                  placeholder="Enter new password"
                />
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 font-medium"
                  placeholder="Confirm new password"
                />
              </div>

              {passwordError && (
                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-4 rounded-xl font-bold flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl font-bold flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {passwordSuccess}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <span className="mr-2">🔐</span>
                Change Password
              </button>
            </form>
          </div>
        )}

        {/* Booking Detail Modal */}
        {showBookingDetail && selectedBooking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-8 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mr-3 sm:mr-4">
                    <span className="text-xl sm:text-2xl">📋</span>
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Booking Details
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">Complete information about this booking</p>
                  </div>
                </div>
                <button
                  onClick={closeBookingDetail}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200 self-end sm:self-auto"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Booking Information */}
              <div className="space-y-6 sm:space-y-8">
                {/* User Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    User Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">Full Name</label>
                      <p className="text-base sm:text-lg font-semibold text-gray-900">{selectedBooking.user.name}</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">Roll Number</label>
                      <p className="text-base sm:text-lg font-semibold text-gray-900">{selectedBooking.user.rollNo}</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">Department</label>
                      <p className="text-base sm:text-lg font-semibold text-gray-900">{selectedBooking.user.department}</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">Email</label>
                      <p className="text-base sm:text-lg font-semibold text-gray-900 break-all">{selectedBooking.user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Slot Information */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 sm:p-6">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Slot Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">Date</label>
                      <p className="text-base sm:text-lg font-semibold text-gray-900">{formatDate(selectedBooking.slotDate)}</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">Time</label>
                      <p className="text-base sm:text-lg font-semibold text-gray-900">{selectedBooking.slotTime}</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">Booking ID</label>
                      <p className="text-base sm:text-lg font-semibold text-gray-900 font-mono text-xs sm:text-base break-all">{selectedBooking.id}</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">Booked At</label>
                      <p className="text-base sm:text-lg font-semibold text-gray-900">{formatDate(selectedBooking.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Project Information */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Project Information
                  </h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">Project Name</label>
                      <p className="text-base sm:text-lg font-semibold text-gray-900">{selectedBooking.projectName}</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">Venue</label>
                      <p className="text-base sm:text-lg font-semibold text-blue-600">{selectedBooking.venue}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">Team Lead Name</label>
                        <p className="text-base sm:text-lg font-semibold text-gray-900">{selectedBooking.teamLeadName}</p>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">Team Lead Roll No</label>
                        <p className="text-base sm:text-lg font-semibold text-gray-900">{selectedBooking.teamLeadRollNo}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  onClick={closeBookingDetail}
                  className="w-full sm:w-auto bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    removeBooking(selectedBooking.id)
                    closeBookingDetail()
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
                >
                  <span className="mr-2">🗑️</span>
                  Remove Booking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
