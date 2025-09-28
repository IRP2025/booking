'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
// import { useUser } from '@/contexts/UserContext'
import Modal from '@/components/Modal'

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
  const [teamMembers, setTeamMembers] = useState([
    { name: '', rollNo: '', department: '', year: '' }
  ])
  const [bookingData, setBookingData] = useState({
    teamLeadName: '',
    teamLeadRollNo: '',
    projectName: ''
  })
  const [systemActive, setSystemActive] = useState(true)
  const [systemStatusLoading, setSystemStatusLoading] = useState(true)

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

  // Fetch real booking data from Supabase
  const fetchSlots = async () => {
    try {
      setLoading(true)
      
      // Get all possible slots
      const dates = ['2025-10-06', '2025-10-07', '2025-10-08', '2025-10-09', '2025-10-10']
      const times = [
        { id: '1', time: '1:30 PM - 2:00 PM' },
        { id: '2', time: '2:00 PM - 2:30 PM' },
        { id: '3', time: '2:30 PM - 3:00 PM' },
        { id: '4', time: '3:00 PM - 3:30 PM' }
      ]

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
        { id: '1', time: '1:30 PM - 2:00 PM' },
        { id: '2', time: '2:00 PM - 2:30 PM' },
        { id: '3', time: '2:30 PM - 3:00 PM' },
        { id: '4', time: '3:00 PM - 3:30 PM' }
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
      }
    } catch (error) {
      console.error('Error checking user booking:', error)
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
  const handleSlotClick = (slot: BookingSlot) => {
    // Force immediate system status check
    loadSystemStatus()
    
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

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: '', rollNo: '', department: '', year: '' }])
  }

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index))
  }

  const updateTeamMember = (index: number, field: string, value: string) => {
    const updated = [...teamMembers]
    updated[index] = { ...updated[index], [field]: value }
    setTeamMembers(updated)
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
        // Update user profile with booking details
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            team_lead_name: bookingData.teamLeadName,
            team_lead_roll_no: bookingData.teamLeadRollNo,
            project_name: bookingData.projectName
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
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl my-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
                <p className="text-gray-600">Add your team member details (optional)</p>
                <p className="text-sm text-gray-500 mt-2">You can skip this for now and complete it later</p>
              </div>
              
              <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                {teamMembers.map((member, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Team Member {index + 1}</h3>
                      {teamMembers.length > 1 && (
                        <button
                          onClick={() => removeTeamMember(index)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <span className="text-sm">Remove</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 bg-white"
                          placeholder="Enter team member name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number *</label>
                        <input
                          type="text"
                          value={member.rollNo}
                          onChange={(e) => updateTeamMember(index, 'rollNo', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 bg-white"
                          placeholder="Enter roll number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                        <select
                          value={member.department}
                          onChange={(e) => updateTeamMember(index, 'department', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                        <select
                          value={member.year}
                          onChange={(e) => updateTeamMember(index, 'year', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        >
                          <option value="">Select Year</option>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-center sticky bottom-0 bg-white pt-4 border-t border-gray-200">
                  <button
                    onClick={addTeamMember}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                  >
                    + Add Team Member
                  </button>
                </div>
              </div>
              
              {teamMembers.length > 3 && (
                <div className="text-center mt-2">
                  <p className="text-sm text-gray-500">Scroll up to see more team members</p>
                </div>
              )}
              
              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={handleProfileSkip}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                >
                  Skip for Now
                </button>
                <button
                  onClick={handleProfileComplete}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                >
                  Complete Profile
                </button>
              </div>
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
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📅</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Your Slot</h2>
                <p className="text-gray-600">
                  Selected: {formatDate(selectedSlot.date)} at {selectedSlot.time}
                </p>
              </div>
              
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team Lead Name *</label>
                  <input
                    type="text"
                    value={bookingData.teamLeadName}
                    onChange={(e) => setBookingData({...bookingData, teamLeadName: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 bg-white"
                    placeholder="Enter team lead name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team Lead Roll Number *</label>
                  <input
                    type="text"
                    value={bookingData.teamLeadRollNo}
                    onChange={(e) => setBookingData({...bookingData, teamLeadRollNo: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 bg-white"
                    placeholder="Enter team lead roll number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
                  <input
                    type="text"
                    value={bookingData.projectName}
                    onChange={(e) => setBookingData({...bookingData, projectName: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900 bg-white"
                    placeholder="Enter project name"
                  />
                </div>
                
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isBooking}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm flex items-center justify-center"
                  >
                    {isBooking ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
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
                    className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm"
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
            <p className="text-lg text-gray-600 mb-2">October 6-10, 2025</p>
            {userHasBooking ? (
              <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-4">
                <p className="text-blue-800 font-medium">You already have a booking!</p>
                <p className="text-blue-600 text-sm">
                  {existingBooking && `Booked for ${formatDate(existingBooking.slot_date)} at ${existingBooking.slot_time}`}
                </p>
                <p className="text-blue-600 text-sm">Each user can only book one slot.</p>
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
                {['2025-10-06', '2025-10-07', '2025-10-08', '2025-10-09', '2025-10-10'].map(date => (
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
            <p className="text-sm text-gray-500 mb-6">
              You will receive a confirmation email shortly. Please arrive 10 minutes before your scheduled time.
            </p>
            <button
              onClick={() => setShowBookingSuccess(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Great! Continue
            </button>
          </div>
        </Modal>
      </div>
    </div>
  )
}