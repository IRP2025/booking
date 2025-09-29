'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
// import { useUser } from '@/contexts/UserContext'
import Modal from '@/components/Modal'
import { generateAndDownloadTicket, generateTicketPreview, TicketData } from '@/lib/ticketGenerator'
import { getSystemConfig, SystemConfig, defaultSystemConfig } from '@/lib/systemConfig'

interface BookingSlot {
  id: string
  date: string
  time: string
  isAvailable: boolean
  bookedBy?: string
  projectName?: string
}

interface User {
  id: string
  name: string
  roll_no: string
  department: string
  email: string
  year: number
  team_lead_name?: string
  team_lead_roll_no?: string
  project_name?: string
}

interface Booking {
  id: string
  user_id: string
  slot_date: string
  slot_time: string
  status: string
  created_at: string
  users?: {
    name: string
    project_name: string
    team_lead_name: string
    team_lead_roll_no: string
  }
}

export default function BookingPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showBookingSuccess, setShowBookingSuccess] = useState(false)
  const [showSlotInfo, setShowSlotInfo] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null)
  const [profileCompleted, setProfileCompleted] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [userHasBooking, setUserHasBooking] = useState(false)
  const [existingBooking, setExistingBooking] = useState<Booking | null>(null)
  const [bookingData, setBookingData] = useState({
    name: '',
    projectTitle: '',
    department: '',
    year: ''
  })
  const [systemActive, setSystemActive] = useState(true)
  const [systemStatusLoading, setSystemStatusLoading] = useState(true)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [ticketPreview, setTicketPreview] = useState<string>('')
  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false)

  // Load system status from database
  const loadSystemStatus = async () => {
    try {
      setSystemStatusLoading(true)
      const { data, error } = await supabase
        .from('admin_settings')
        .select('system_active')
        .single()

      if (!error && data) {
        console.log('System status loaded:', data.system_active)
        setSystemActive(data.system_active)
      } else {
        console.error('Error loading system status:', error)
      }
    } catch (error) {
      console.error('Error loading system status:', error)
    } finally {
      setSystemStatusLoading(false)
    }
  }

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('user')
        setUser(null)
      }
    } else {
      setUser(null)
    }
    setUserLoading(false)
  }, [])

  // Sign out function
  const signOut = async () => {
    localStorage.removeItem('user')
    setUser(null)
    router.push('/user/auth')
  }

  // Show profile popup only once and only if not completed
  useEffect(() => {
    if (user) {
      const hasSeenProfilePopup = localStorage.getItem('hasSeenProfilePopup')
      const isProfileCompleted = localStorage.getItem('profileCompleted')
      
      if (!hasSeenProfilePopup && !isProfileCompleted) {
        setShowProfilePopup(true)
      }
      
      if (isProfileCompleted === 'true') {
        setProfileCompleted(true)
      }
    }
  }, [user])

  const [slots, setSlots] = useState<BookingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(defaultSystemConfig)

  // Load system configuration and listen for changes
  useEffect(() => {
    // Load initial configuration
    setSystemConfig(getSystemConfig())
    
    // Listen for configuration changes from localStorage
    const handleStorageChange = () => {
      setSystemConfig(getSystemConfig())
    }
    
    // Listen for storage events (when admin saves config)
    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically for changes (in case of same-tab updates)
    const interval = setInterval(() => {
      const currentConfig = getSystemConfig()
      setSystemConfig(prevConfig => {
        if (JSON.stringify(prevConfig) !== JSON.stringify(currentConfig)) {
          return currentConfig
        }
        return prevConfig
      })
    }, 1000) // Check every second
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // Refetch slots when configuration changes
  useEffect(() => {
    if (systemConfig.eventDates.length > 0) {
      fetchSlots()
    }
  }, [systemConfig])


  // Fetch real booking data from Supabase
  const fetchSlots = async () => {
    try {
      setLoading(true)
      
      // Use dynamic configuration from state
      const dates = systemConfig.eventDates

      // Get all bookings from database
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          slot_date,
          slot_time,
          users(name, project_name)
        `)

      if (error) {
        console.error('Error fetching bookings:', error)
        // Create empty slots if database fails
        const allSlots: BookingSlot[] = []
        dates.forEach(date => {
          const times = systemConfig.dateSpecificSlots[date] || []
          times.forEach(time => {
            allSlots.push({
              id: `${date}-${time.id}`,
              date,
              time: time.time,
              isAvailable: true
            })
          })
        })
        setSlots(allSlots)
        return
      }

      // Create a map of booked slots
      const bookedSlots = new Map()
      bookings?.forEach(booking => {
        const key = `${booking.slot_date}-${booking.slot_time}`
        const userData = Array.isArray(booking.users) ? booking.users[0] : booking.users
        bookedSlots.set(key, {
          bookedBy: userData?.name || 'Unknown',
          projectName: userData?.project_name || 'Unknown Project'
        })
      })

      // Generate all slots with real booking status
      const allSlots: BookingSlot[] = []
      dates.forEach(date => {
        const times = systemConfig.dateSpecificSlots[date] || []
        times.forEach(time => {
          const slotId = `${date}-${time.id}`
          const key = `${date}-${time.time}`
          const bookingInfo = bookedSlots.get(key)
          
          allSlots.push({
            id: slotId,
            date,
            time: time.time,
            isAvailable: !bookingInfo,
            bookedBy: bookingInfo?.bookedBy,
            projectName: bookingInfo?.projectName
          })
        })
      })

      setSlots(allSlots)
    } catch (error) {
      console.error('Error fetching slots:', error)
      // Create empty slots if there's an error
      const dates = ['2025-10-06', '2025-10-07', '2025-10-08', '2025-10-09', '2025-10-10']
      const times = [
        { id: '1', time: '1:45 PM - 2:15 PM' },
        { id: '2', time: '2:15 PM - 2:45 PM' },
        { id: '3', time: '2:45 PM - 3:15 PM' },
        { id: '4', time: '3:15 PM - 3:45 PM' }
      ]
      const allSlots: BookingSlot[] = []
      dates.forEach(date => {
        times.forEach(time => {
          allSlots.push({
            id: `${date}-${time.id}`,
            date,
            time: time.time,
            isAvailable: true
          })
        })
      })
      setSlots(allSlots)
    } finally {
      setLoading(false)
    }
  }

  // Check if user already has a booking
  const checkUserBooking = async () => {
    if (!user) return
    
    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          users(name, project_name, team_lead_name, team_lead_roll_no)
        `)
        .eq('user_id', user.id)
        .single()

      if (booking && !error) {
        setUserHasBooking(true)
        setExistingBooking(booking as Booking)
      } else {
        // No booking found or error - reset the state
        setUserHasBooking(false)
        setExistingBooking(null)
      }
    } catch (error) {
      console.error('Error checking user booking:', error)
      // Reset state on error as well
      setUserHasBooking(false)
      setExistingBooking(null)
    }
  }

  useEffect(() => {
    loadSystemStatus()
    fetchSlots()
    checkUserBooking()
  }, [user])

  // Set up real-time subscription for bookings and system status
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('bookings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          // Refetch slots when bookings change
          fetchSlots()
          // Also refresh user booking status
          checkUserBooking()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_settings'
        },
        (payload) => {
          console.log('System status changed:', payload)
          // Refetch system status when admin changes it
          loadSystemStatus()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Also set up a periodic check for system status (fallback)
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      loadSystemStatus()
    }, 2000) // Check every 2 seconds for faster updates

    return () => {
      clearInterval(interval)
    }
  }, [user])

  // Force immediate status check when user interacts with slots
  const handleSlotClick = async (slot: BookingSlot) => {
    // Force immediate system status check
    loadSystemStatus()
    
    // Refresh user booking status in case it was recently removed
    await checkUserBooking()
    
    // Check if system is active first
    if (!systemActive) {
      setSelectedSlot(slot)
      setShowSlotInfo(true)
      return
    }

    if (userHasBooking) {
      // Show existing booking info instead
      setShowSlotInfo(true)
      setSelectedSlot({
        ...slot,
        bookedBy: existingBooking?.users?.name || 'You',
        projectName: existingBooking?.users?.project_name || 'Your Project'
      })
      return
    }

    if (slot.isAvailable) {
      setSelectedSlot(slot)
      setShowInstructions(true)
    } else {
      setSelectedSlot(slot)
      setShowSlotInfo(true)
    }
  }


  const handleDownloadTicket = async () => {
    if (!user) return
    
    setIsGeneratingTicket(true)
    try {
      // Use existing booking data if available, otherwise use selected slot
      let slotDate: string
      let slotTime: string
      let bookingId: string
      let createdAt: string

      if (existingBooking) {
        // User has an existing booking - use that data
        slotDate = existingBooking.slot_date
        slotTime = existingBooking.slot_time
        bookingId = existingBooking.id
        createdAt = existingBooking.created_at
      } else if (selectedSlot) {
        // User is booking a new slot
        slotDate = selectedSlot.date
        slotTime = selectedSlot.time
        bookingId = 'temp-id'
        createdAt = new Date().toISOString()
      } else {
        // No booking data available
        console.error('No booking data available for ticket generation')
        setIsGeneratingTicket(false)
        return
      }

      const ticketData: TicketData = {
        bookingId,
        teamLeadName: user.name || bookingData.name,
        teamLeadRollNo: user.roll_no,
        projectName: user.project_name || bookingData.projectTitle,
        slotDate,
        slotTime,
        department: user.department || bookingData.department,
        year: user.year?.toString() || bookingData.year,
        userName: user.name || bookingData.name,
        userRollNo: user.roll_no,
        userEmail: user.email || '',
        createdAt
      }
      
      await generateAndDownloadTicket(ticketData)
    } catch (error) {
      console.error('Error downloading ticket:', error)
    } finally {
      setIsGeneratingTicket(false)
    }
  }


  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if system is active before allowing booking
    if (!systemActive) {
      setShowBookingForm(false)
      return
    }
    
    if (selectedSlot && user) {
      setIsBooking(true)
      try {
        // Update user profile with individual details
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            name: bookingData.name,
            project_name: bookingData.projectTitle,
            department: bookingData.department,
            year: parseInt(bookingData.year)
          })
          .eq('id', user.id)

        if (userUpdateError) {
          console.error('Error updating user:', userUpdateError)
          return
        }

        // Create the booking
        const { data: newBooking, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            user_id: user.id,
            slot_date: selectedSlot.date,
            slot_time: selectedSlot.time,
            status: 'confirmed'
          })
          .select()
          .single()

        if (bookingError) {
          console.error('Error creating booking:', bookingError)
          return
        }

        // Refresh the slots to show updated status
        await fetchSlots()
        await checkUserBooking()
        
        // Generate ticket data
        if (newBooking) {
          const ticketData: TicketData = {
            bookingId: newBooking.id,
            teamLeadName: bookingData.name,
            teamLeadRollNo: user.roll_no,
            projectName: bookingData.projectTitle,
            slotDate: selectedSlot.date,
            slotTime: selectedSlot.time,
            department: bookingData.department,
            year: bookingData.year,
            userName: bookingData.name,
            userRollNo: user.roll_no,
            userEmail: user.email || '',
            createdAt: newBooking.created_at
          }
          
          // Generate ticket preview
          try {
            const preview = await generateTicketPreview(ticketData)
            setTicketPreview(preview)
            setShowTicketModal(true)
          } catch (error) {
            console.error('Error generating ticket preview:', error)
          }
        }
        
        setShowBookingForm(false)
        setShowBookingSuccess(true)
      } catch (error) {
        console.error('Error during booking:', error)
        setShowBookingForm(false)
        setShowBookingSuccess(true)
      } finally {
        setIsBooking(false)
      }
    }
  }

  const handleProfileComplete = () => {
    setShowProfilePopup(false)
    setProfileCompleted(true)
    localStorage.setItem('profileCompleted', 'true')
    localStorage.setItem('hasSeenProfilePopup', 'true')
    
    // Show a brief success message
    setTimeout(() => {
      // You could add a toast notification here if needed
    }, 100)
  }

  const handleProfileSkip = () => {
    setShowProfilePopup(false)
    localStorage.setItem('hasSeenProfilePopup', 'true')
  }

  const handleProfileButtonClick = () => {
    setShowProfilePopup(true)
  }

  const handleTicketPreview = async () => {
    if (!user) return
    
    try {
      setIsGeneratingTicket(true)
      
      // Use existing booking data if available, otherwise use selected slot
      let slotDate: string
      let slotTime: string
      let bookingId: string
      let createdAt: string

      if (existingBooking) {
        // User has an existing booking - use that data
        slotDate = existingBooking.slot_date
        slotTime = existingBooking.slot_time
        bookingId = existingBooking.id
        createdAt = existingBooking.created_at
      } else if (selectedSlot) {
        // User is booking a new slot
        slotDate = selectedSlot.date
        slotTime = selectedSlot.time
        bookingId = 'temp-id'
        createdAt = new Date().toISOString()
      } else {
        // No booking data available
        console.error('No booking data available for ticket preview')
        return
      }

      const ticketData: TicketData = {
        bookingId,
        teamLeadName: user.name || bookingData.name,
        teamLeadRollNo: user.roll_no,
        projectName: user.project_name || bookingData.projectTitle,
        slotDate,
        slotTime,
        department: user.department || bookingData.department,
        year: user.year?.toString() || bookingData.year,
        userName: user.name || bookingData.name,
        userRollNo: user.roll_no,
        userEmail: user.email || '',
        createdAt
      }
      
      const preview = await generateTicketPreview(ticketData)
      setTicketPreview(preview)
      setShowTicketModal(true)
    } catch (error) {
      console.error('Error generating ticket preview:', error)
    } finally {
      setIsGeneratingTicket(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Show loading while checking authentication
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show message if not authenticated (only after loading is complete)
  if (!userLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-lg text-gray-600 mb-8">Please log in to access the booking system.</p>
          <Link 
            href="/user/auth"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/irp-logo.jpg"
                alt="IRP Logo"
                width={50}
                height={50}
                className="rounded-lg shadow-sm"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">IRP Booking System</h1>
                <p className="text-sm text-gray-600">Book your review session</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <button
                onClick={handleProfileButtonClick}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm flex items-center gap-2 ${
                  profileCompleted 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {profileCompleted ? 'Profile Complete' : 'Complete Profile'}
              </button>
              <button
                onClick={signOut}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
        {/* Profile Completion Popup */}
        {showProfilePopup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-6 lg:p-8 w-full max-w-2xl lg:max-w-5xl my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
              <div className="text-center mb-6 sm:mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                  <span className="text-2xl sm:text-3xl">👤</span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                  Complete Your Profile
                </h2>
                <p className="text-gray-600 text-sm sm:text-base lg:text-lg font-medium">Add your personal details (required for booking)</p>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleProfileComplete(); }} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={bookingData.name}
                    onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 bg-white text-sm sm:text-base"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
                  <input
                    type="text"
                    value={bookingData.projectTitle}
                    onChange={(e) => setBookingData({...bookingData, projectTitle: e.target.value})}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 bg-white text-sm sm:text-base"
                    placeholder="Enter your project title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <select
                    value={bookingData.department}
                    onChange={(e) => setBookingData({...bookingData, department: e.target.value})}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm sm:text-base"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
                  <select
                    value={bookingData.year}
                    onChange={(e) => setBookingData({...bookingData, year: e.target.value})}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm sm:text-base"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 lg:gap-6 mt-6 sm:mt-8">
                  <button
                    type="button"
                    onClick={handleProfileSkip}
                    className="w-full sm:w-auto bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-xl font-bold text-sm sm:text-base lg:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <span className="mr-2">⏭️</span>
                    Skip for Now
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-xl font-bold text-sm sm:text-base lg:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <span className="mr-2">✅</span>
                    Complete Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Booking Instructions Modal */}
        {showInstructions && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📋</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Session Instructions</h2>
                <p className="text-gray-600">Please read these guidelines carefully before booking</p>
              </div>
              
              <div className="space-y-4 mb-8">
                {[
                  "Reviewers will come from industry professionals",
                  "Make sure to give a professional presentation",
                  "Get your PPT prepared and professional",
                  "Once booked, you cannot change your slot",
                  "Be punctual and arrive 10 minutes before your slot"
                ].map((instruction, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{instruction}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setShowInstructions(false)
                    setShowBookingForm(true)
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                >
                  I Have Read All Instructions
                </button>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Booking Form Modal */}
        {showBookingForm && selectedSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-sm sm:max-w-md lg:max-w-lg max-h-[95vh] overflow-y-auto">
              <div className="text-center mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl sm:text-2xl">📅</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Book Your Slot</h2>
                <p className="text-gray-600">
                  Selected: {formatDate(selectedSlot.date)} at {selectedSlot.time}
                </p>
              </div>
              
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={bookingData.name}
                    onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 bg-white text-sm sm:text-base"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
                  <input
                    type="text"
                    value={bookingData.projectTitle}
                    onChange={(e) => setBookingData({...bookingData, projectTitle: e.target.value})}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 bg-white text-sm sm:text-base"
                    placeholder="Enter your project title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <select
                    value={bookingData.department}
                    onChange={(e) => setBookingData({...bookingData, department: e.target.value})}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm sm:text-base"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
                  <select
                    value={bookingData.year}
                    onChange={(e) => setBookingData({...bookingData, year: e.target.value})}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white text-sm sm:text-base"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    type="submit"
                    disabled={isBooking}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm flex items-center justify-center text-sm sm:text-base"
                  >
                    {isBooking ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                        Booking...
                      </>
                    ) : (
                      'Book Slot'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    disabled={isBooking}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* System Status Banner */}
        {!systemStatusLoading && !systemActive && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Booking System Currently Inactive
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>The booking system is currently disabled by the administrator. Please check back later or contact support for more information.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Available Review Slots</h2>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{systemConfig.eventTitle}</h3>
            <p className="text-lg text-gray-600 mb-2">{systemConfig.eventSubtitle}</p>
            <p className="text-sm text-gray-500 max-w-2xl mx-auto mb-4">{systemConfig.eventDescription}</p>
            
            {userHasBooking ? (
              <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-4">
                <p className="text-blue-800 font-medium">You already have a booking!</p>
                <p className="text-blue-600 text-sm">
                  {existingBooking && `Booked for ${formatDate(existingBooking.slot_date)} at ${existingBooking.slot_time}`}
                </p>
                <p className="text-blue-600 text-sm">Each user can only book one slot.</p>
                <button
                  onClick={handleDownloadTicket}
                  disabled={isGeneratingTicket}
                  className="mt-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-md disabled:opacity-50 flex items-center"
                >
                  {isGeneratingTicket ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Ticket
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-gray-500">Click on available slots (green) to book your review session</p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading slots...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {systemConfig.eventDates.map(date => (
                  <div key={date} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                    <h3 className="font-bold text-xl mb-6 text-center text-gray-800">
                      {formatDate(date)}
                    </h3>
                    <div className="space-y-3">
                      {slots
                        .filter(slot => slot.date === date)
                        .map(slot => (
                          <button
                            key={slot.id}
                            onClick={() => handleSlotClick(slot)}
                            className={`w-full p-4 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                              slot.isAvailable
                                ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                                : 'bg-red-500 text-white cursor-not-allowed opacity-80'
                            }`}
                            disabled={!slot.isAvailable}
                          >
                            <div className="text-center">
                              <div className="font-semibold">{slot.time}</div>
                              {!slot.isAvailable && (
                                <div className="text-xs mt-1 opacity-90">
                                  Booked
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex justify-center gap-8">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Booked</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Slot Information Modal */}
        <Modal
          isOpen={showSlotInfo}
          onClose={() => setShowSlotInfo(false)}
          title="Slot Information"
        >
          <div className="text-center">
            {!systemActive ? (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">System Inactive</h3>
                <p className="text-gray-600 mb-4">
                  The booking system is currently disabled by the administrator. Please check back later.
                </p>
                <button
                  onClick={() => setShowSlotInfo(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Slot Already Booked</h3>
                <p className="text-gray-600 mb-4">
                  This slot is already booked by <strong>{selectedSlot?.bookedBy}</strong> for the project:
                </p>
                <p className="text-lg font-medium text-blue-600 mb-6">{selectedSlot?.projectName}</p>
                <button
                  onClick={() => setShowSlotInfo(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </Modal>

        {/* Booking Success Modal */}
        <Modal
          isOpen={showBookingSuccess}
          onClose={() => setShowBookingSuccess(false)}
          title="Booking Confirmed!"
          showCloseButton={false}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Successful!</h3>
            <p className="text-gray-600 mb-4">
              Your review slot has been confirmed for:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="font-semibold text-gray-900">{formatDate(selectedSlot?.date || '')}</p>
              <p className="text-blue-600">{selectedSlot?.time}</p>
            </div>
            {/* Instructions */}
            {systemConfig.instructions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <span className="mr-2">📋</span>
                  Important Instructions:
                </h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  {systemConfig.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 text-blue-600">•</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => setShowBookingSuccess(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Great! Continue
            </button>
          </div>
        </Modal>

        {/* Ticket Preview Modal */}
        <Modal
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
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
              Booking Confirmed! 🎉
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              Your slot has been successfully booked. Download your ticket below for verification.
            </p>
            
            {/* Ticket Preview */}
            {ticketPreview && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Ticket Preview:</h4>
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  <img 
                    src={ticketPreview} 
                    alt="Ticket Preview" 
                    className="max-w-full h-auto rounded-lg shadow-md"
                    style={{ maxHeight: '300px' }}
                  />
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleDownloadTicket}
                disabled={isGeneratingTicket}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
              >
                {isGeneratingTicket ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Generating Ticket...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Ticket (PNG)
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowTicketModal(false)}
                className="w-full text-gray-600 hover:text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Close
              </button>
            </div>
            
            {/* Helpful Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-center space-x-2 text-blue-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">
                  Keep your ticket safe! You'll need it for verification on the day of your review.
                </span>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}