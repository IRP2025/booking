// System configuration utility
export interface SystemConfig {
  eventTitle: string
  eventSubtitle: string
  eventDescription: string
  eventDates: string[]
  timeSlots: { id: string; time: string }[]
  dateSpecificSlots: { [date: string]: { id: string; time: string }[] }
  enrollmentTimes: { [date: string]: { startTime: string; endTime: string } }
  instructions: string[]
}

// Default configuration
export const defaultSystemConfig: SystemConfig = {
  eventTitle: 'IRP Booking System',
  eventSubtitle: 'Innovation & Research Park',
  eventDescription: 'Book review slots for your project presentations',
  eventDates: ['2025-10-06', '2025-10-07', '2025-10-08', '2025-10-09', '2025-10-10'],
  timeSlots: [
    { id: '1', time: '1:45 PM - 2:15 PM' },
    { id: '2', time: '2:15 PM - 2:45 PM' },
    { id: '3', time: '2:45 PM - 3:15 PM' },
    { id: '4', time: '3:15 PM - 3:45 PM' }
  ],
  dateSpecificSlots: {
    '2025-10-06': [
      { id: '1', time: '1:45 PM - 2:15 PM' },
      { id: '2', time: '2:15 PM - 2:45 PM' },
      { id: '3', time: '2:45 PM - 3:15 PM' },
      { id: '4', time: '3:15 PM - 3:45 PM' }
    ],
    '2025-10-07': [
      { id: '1', time: '1:45 PM - 2:15 PM' },
      { id: '2', time: '2:15 PM - 2:45 PM' },
      { id: '3', time: '2:45 PM - 3:15 PM' },
      { id: '4', time: '3:15 PM - 3:45 PM' }
    ],
    '2025-10-08': [
      { id: '1', time: '1:45 PM - 2:15 PM' },
      { id: '2', time: '2:15 PM - 2:45 PM' },
      { id: '3', time: '2:45 PM - 3:15 PM' },
      { id: '4', time: '3:15 PM - 3:45 PM' }
    ],
    '2025-10-09': [
      { id: '1', time: '1:45 PM - 2:15 PM' },
      { id: '2', time: '2:15 PM - 2:45 PM' },
      { id: '3', time: '2:45 PM - 3:15 PM' },
      { id: '4', time: '3:15 PM - 3:45 PM' }
    ],
    '2025-10-10': [
      { id: '1', time: '1:45 PM - 2:15 PM' },
      { id: '2', time: '2:15 PM - 2:45 PM' },
      { id: '3', time: '2:45 PM - 3:15 PM' },
      { id: '4', time: '3:15 PM - 3:45 PM' }
    ]
  },
  enrollmentTimes: {
    '2025-10-06': { startTime: '16:00', endTime: '18:00' },
    '2025-10-07': { startTime: '16:00', endTime: '18:00' },
    '2025-10-08': { startTime: '16:00', endTime: '18:00' },
    '2025-10-09': { startTime: '16:00', endTime: '18:00' },
    '2025-10-10': { startTime: '16:00', endTime: '18:00' }
  },
  instructions: [
    'Reviewers will come from industry professionals',
    'Make sure to give a professional presentation',
    'Get your PPT prepared and professional',
    'Once booked, you cannot change your slot',
    'Be punctual and arrive 10 minutes before your slot'
  ]
}

// Get system configuration from localStorage or return default
export const getSystemConfig = (): SystemConfig => {
  if (typeof window === 'undefined') {
    return defaultSystemConfig
  }
  
  try {
    const savedConfig = localStorage.getItem('systemConfig')
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig)
      // Merge with default to ensure all fields exist
      return { ...defaultSystemConfig, ...parsed }
    }
  } catch (error) {
    console.error('Error loading system configuration:', error)
  }
  
  return defaultSystemConfig
}

// Save system configuration to localStorage
export const saveSystemConfig = (config: SystemConfig): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('systemConfig', JSON.stringify(config))
    } catch (error) {
      console.error('Error saving system configuration:', error)
    }
  }
}
