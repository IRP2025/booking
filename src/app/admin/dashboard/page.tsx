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
  teamLeadName: string
  teamLeadRollNo: string
  createdAt: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [systemActive, setSystemActive] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminSlots, setAdminSlots] = useState([])
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
            project_name
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
          name: booking.users.name,
          rollNo: booking.users.roll_no,
          department: booking.users.department,
          email: booking.users.email
        },
        slotDate: booking.slot_date,
        slotTime: booking.slot_time,
        projectName: booking.users.project_name,
        teamLeadName: booking.users.team_lead_name,
        teamLeadRollNo: booking.users.team_lead_roll_no,
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
        { id: '1', time: '1:30 PM - 2:00 PM' },
        { id: '2', time: '2:00 PM - 2:30 PM' },
        { id: '3', time: '2:30 PM - 3:00 PM' },
        { id: '4', time: '3:00 PM - 3:30 PM' }
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
          bookedBy: booking.users.name,
          projectName: booking.users.project_name,
          teamLeadName: booking.users.team_lead_name,
          teamLeadRollNo: booking.users.team_lead_roll_no
        })
      })

      // Generate all slots with booking status
      const allSlots = []
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
      // First, verify the current password by checking the database
      const { data: admin, error: fetchError } = await supabase
        .from('admin_users')
        .select('password_hash')
        .eq('username', 'admin')
        .single()

      if (fetchError || !admin) {
        setPasswordError('Failed to verify current password')
        return
      }

      // For now, we'll check against the hardcoded password as fallback
      // In a production system, you'd verify the hashed password
      if (currentPassword !== '2025' && currentPassword !== admin.password_hash) {
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

      // Update the password in the database
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/irp-logo.jpg"
                  alt="IRP Logo"
                  width={50}
                  height={50}
                  className="rounded-lg mr-3"
                />
                <h1 className="text-xl font-bold text-gray-800">IRP Admin Dashboard</h1>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                systemActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {systemActive ? 'System Active' : 'System Inactive'}
              </div>
              {timerActive && (
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                  ⏰ Auto-deactivate in: {formatTimeRemaining(timeRemaining)}
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'bookings', name: 'All Bookings', icon: '📅' },
                { id: 'slots', name: 'Visual Slots', icon: '🎯' },
                { id: 'settings', name: 'System Settings', icon: '⚙️' },
                { id: 'password', name: 'Change Password', icon: '🔒' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <span className="text-2xl">📅</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                        <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${
                        systemActive ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <span className={`text-2xl ${
                          systemActive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {systemActive ? '✅' : '❌'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">System Status</p>
                        <p className={`text-2xl font-bold ${
                          systemActive ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {systemActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <span className="text-2xl">👥</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Unique Users</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {new Set(bookings.map(b => b.user.rollNo)).size}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Slot
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Project
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Booked At
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.slice(0, 5).map(booking => (
                          <tr key={booking.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {booking.user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {booking.user.rollNo} • {booking.user.department}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(booking.slotDate)} at {booking.slotTime}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {booking.projectName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                    <tr key={booking.id}>
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => removeBooking(booking.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
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
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">System Control</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">System Status</h4>
                    <p className="text-sm text-gray-500">
                      Control whether users can book slots
                    </p>
                  </div>
                  <button
                    onClick={handleSystemToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      systemActive ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        systemActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Auto Deactivate Timer</h4>
                  <p className="text-sm text-gray-500 mb-3">
                    Set a timer to automatically deactivate the system
                  </p>
                  
                  {timerActive ? (
                    <div className="space-y-3">
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-800">Timer Active</p>
                            <p className="text-lg font-bold text-orange-900">
                              {formatTimeRemaining(timeRemaining)}
                            </p>
                            <p className="text-xs text-orange-600">
                              System will deactivate automatically
                            </p>
                          </div>
                          <div className="text-2xl">⏰</div>
                        </div>
                      </div>
                      <button
                        onClick={handleCancelTimer}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                      >
                        Cancel Timer
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={autoDeactivate}
                        onChange={(e) => setAutoDeactivate(e.target.value)}
                        placeholder="Minutes"
                        min="1"
                        className="px-3 py-2 border border-gray-300 rounded-md w-32 placeholder:text-black text-black"
                      />
                      <button
                        onClick={handleAutoDeactivate}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-black text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-black text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-black text-black"
                />
              </div>

              {passwordError && (
                <div className="text-red-600 text-sm">{passwordError}</div>
              )}

              {passwordSuccess && (
                <div className="text-green-600 text-sm">{passwordSuccess}</div>
              )}

              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Change Password
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
