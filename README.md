# IRP Booking System

A comprehensive booking system for IRP (Innovation & Research Park) review sessions, built with Next.js and Supabase.

## Features

### User Features
- **Landing Page**: Clean interface with IRP logo and main navigation
- **User Authentication**: Sign up and sign in with detailed user information
- **Profile Completion**: Team member details collection popup
- **Booking System**: Movie-style UI for slot selection
- **Review Instructions**: Clear guidelines for presentation sessions
- **Real-time Slot Status**: Visual indicators for available/booked slots

### Admin Features
- **Admin Dashboard**: Comprehensive management interface
- **User Management**: View and manage all user bookings
- **System Control**: Activate/deactivate booking system
- **Password Management**: Secure password change functionality
- **Auto Deactivation**: Timer-based system control
- **Booking Management**: Remove bookings and view detailed information

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom implementation with Supabase
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd booking
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The system uses the following main tables:
- `users`: User account information
- `team_members`: Additional team member details
- `bookings`: Review slot bookings
- `admin_settings`: System configuration
- `admin_users`: Admin authentication

## Usage

### For Users
1. Visit the landing page
2. Click "Book Tickets"
3. Create an account or sign in
4. Complete your profile with team details
5. Select an available review slot
6. Read instructions and confirm booking

### For Admins
1. Visit the landing page
2. Click "Login as Admin"
3. Use credentials: admin / 2025
4. Access the dashboard to manage bookings and system settings

## Features Overview

### Booking System
- 4-day booking window (October 6-9, 2025)
- 4 time slots per day (1:45-2:15 PM, 2:15-2:45 PM, 2:45-3:15 PM, 3:15-3:45 PM)
- Real-time availability status
- Conflict prevention for simultaneous bookings

### Admin Controls
- System activation/deactivation
- Timer-based auto deactivation
- User booking management
- Password security
- Comprehensive reporting

## Development

### Project Structure
```
src/
├── app/
│   ├── admin/
│   │   ├── login/
│   │   └── dashboard/
│   ├── user/
│   │   ├── auth/
│   │   └── booking/
│   └── page.tsx
├── components/
└── lib/
    └── supabase.ts
```

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run linter
- `npm run format`: Format code

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.